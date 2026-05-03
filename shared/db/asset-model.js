const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Asset",

  new mongoose.Schema(
    {
      fileName: String,

      checksum: String,

      size: Number,

      status: String,

      previewPath: String,

      compressedPath: String,
    },

    {
      timestamps: true,
    },
  ),
);
