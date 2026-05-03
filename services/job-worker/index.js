require("dotenv").config();

const { Worker } = require("bullmq");

const { Worker: Thread } = require("worker_threads");

const path = require("path");

const connectDB = require("../../shared/db");

const Asset = require("../../shared/db/asset-model");

const preview = require("./preview-generator");

const compress = require("./compress-file");

const metadata = require("./get-metadata");

(async () => {
  await connectDB();

  new Worker(
    "creative-jobs",

    async (job) => {
      const {
        assetId,

        fileName,
      } = job.data;

      await Asset.findByIdAndUpdate(
        assetId,

        {
          status: "processing",
        },
      );

      const checksum = await new Promise((resolve, reject) => {
        const worker = new Thread(
          path.join(
            __dirname,

            "checksum-thread.js",
          ),

          {
            workerData: {
              fileName,
            },
          },
        );

        worker.on(
          "message",

          resolve,
        );

        worker.on(
          "error",

          reject,
        );
      });

      await job.updateProgress(25);

      global.io?.emit(
        "progress",

        {
          assetId,

          progress: 25,
        },
      );

      await preview(fileName);

      await job.updateProgress(50);

      global.io?.emit(
        "progress",

        {
          assetId,

          progress: 50,
        },
      );

      await compress(fileName);

      const info = metadata(fileName);

      await Asset.findByIdAndUpdate(
        assetId,

        {
          checksum: checksum.checksum,

          size: info.size,

          status: "completed",

          previewPath: `previews/${fileName}`,

          compressedPath: `compressed/${fileName}.gz`,
        },
      );

      global.io?.emit(
        "progress",

        {
          assetId,

          progress: 100,
        },
      );
    },

    {
      concurrency: 4,

      connection: {
        host: process.env.REDIS_HOST,

        port: process.env.REDIS_PORT,
      },
    },
  );
})();
