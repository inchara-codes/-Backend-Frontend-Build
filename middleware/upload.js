const crypto = require("crypto");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG, and WebP image files are allowed.")
      );
    }

    callback(null, true);
  },
});

module.exports = upload;