const crypto = require("crypto");

const fs = require("fs");

const path = require("path");

const { parentPort, workerData } = require("worker_threads");

const filePath = path.join(
  "uploads",

  workerData.fileName,
);

const file = fs.readFileSync(filePath);

const checksum = crypto
  .createHash("sha256")

  .update(file)

  .digest("hex");

parentPort.postMessage({
  checksum,
});
