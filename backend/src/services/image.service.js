const { v2: cloudinary } = require("cloudinary");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const productRepository = require("../repositories/product.repository");
const cache = require("../config/redis");

const configured = Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
if (configured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"] },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary returned no upload result"));
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function uploadProductImages(productId, user, files) {
  if (!configured) throw new ApiError(503, "Image uploads are not configured. Set Cloudinary credentials.");
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  if (product.seller_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You can only add images to your own listings");
  }
  if (!files.length) throw ApiError.badRequest("Select at least one product image");

  const uploaded = [];
  try {
    for (const [index, file] of files.entries()) {
      const result = await uploadBuffer(file.buffer, `pulsemarket/products/${productId}`);
      uploaded.push({
        productId,
        url: result.secure_url,
        publicId: result.public_id,
        sortOrder: index,
      });
    }
    const saved = await productRepository.addImages(productId, uploaded);
    await cache.delByPrefix("products:list:");
    return saved.map((image) => ({
      id: image.id,
      url: image.image_url,
      sortOrder: image.sort_order,
    }));
  } catch (error) {
    const cleanupResults = await Promise.allSettled(
      uploaded.map((image) => cloudinary.uploader.destroy(image.publicId))
    );
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("[images] failed to clean up an incomplete Cloudinary upload:", result.reason.message);
      }
    });
    throw error;
  }
}

async function deleteProductImage(productId, imageId, user) {
  if (!configured) throw new ApiError(503, "Image uploads are not configured. Set Cloudinary credentials.");
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  if (product.seller_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You can only remove images from your own listings");
  }
  const result = await productRepository.deleteImage(productId, imageId);
  if (!result) throw ApiError.notFound("Product image not found");
  await cache.delByPrefix("products:list:");
  try {
    await cloudinary.uploader.destroy(result.image.public_id);
  } catch (error) {
    throw new ApiError(502, `Image was removed from the listing, but Cloudinary cleanup failed: ${error.message}`);
  }
  return { deleted: true, primaryImageUrl: result.primaryImageUrl };
}

module.exports = { uploadProductImages, deleteProductImage };
