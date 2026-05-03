const { spawn } = require("child_process");

const path = require("path");

module.exports = function generatePreview(fileName) {
  return new Promise((resolve, reject) => {
    const source = path.join(
      "uploads",

      fileName,
    );

    const destination = path.join(
      "previews",

      fileName,
    );

    const command = process.platform === "win32" ? "cmd" : "cp";

    const args =
      process.platform === "win32"
        ? ["/c", "copy", source, destination]
        : [source, destination];

    const child = spawn(
      command,

      args,
    );

    child.on(
      "error",

      reject,
    );

    child.on(
      "close",

      (code) => {
        if (code !== 0) {
          return reject(new Error("Preview generation failed"));
        }

        resolve();
      },
    );
  });
};
