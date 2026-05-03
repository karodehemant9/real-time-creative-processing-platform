const fs = require("fs");

const path = require("path");

module.exports = function metadata(fileName) {
  const stats = fs.statSync(
    path.join(
      "uploads",

      fileName,
    ),
  );

  return {
    size: stats.size,

    createdAt: stats.birthtime,
  };
};
