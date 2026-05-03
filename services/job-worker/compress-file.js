const fs = require("fs");

const zlib = require("zlib");

const path = require("path");

module.exports = function compress(fileName) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(
      path.join(
        "uploads",

        fileName,
      ),
    );

    const output = fs.createWriteStream(
      path.join(
        "compressed",

        fileName + ".gz",
      ),
    );

    input

      .pipe(zlib.createGzip())

      .pipe(output);

    output.on(
      "finish",

      resolve,
    );

    output.on(
      "error",

      reject,
    );
  });
};
