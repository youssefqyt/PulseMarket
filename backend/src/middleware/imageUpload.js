const multer = require("multer");
const ApiError = require("../utils/ApiError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, WebP, or AVIF images are allowed"));
    }
    return callback(null, true);
  },
}).array("images", 6);

function uploadProductImages(req, res, next) {
  upload(req, res, (error) => {
    if (!error) return next();
    return next(ApiError.badRequest(error.message));
  });
}

module.exports = { uploadProductImages };
