const asyncHandler = require("../utils/asyncHandler");
const imageService = require("../services/image.service");

const uploadProductImages = asyncHandler(async (req, res) => {
  const images = await imageService.uploadProductImages(
    Number(req.params.id),
    req.user,
    req.files || []
  );
  res.status(201).json({ success: true, data: images });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const result = await imageService.deleteProductImage(
    Number(req.params.id),
    Number(req.params.imageId),
    req.user
  );
  res.json({ success: true, data: result });
});

module.exports = { uploadProductImages, deleteProductImage };
