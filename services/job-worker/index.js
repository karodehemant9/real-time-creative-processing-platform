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

  const worker = new Worker(
    "creative-jobs",

    async (job) => {
      console.log("JOB RECEIVED:", job.id);

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
        const thread = new Thread(
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

        thread.on(
          "message",

          resolve,
        );

        thread.on(
          "error",

          reject,
        );
      });

      console.log("checksum done");

      global.io?.emit(
        "progress",

        {
          assetId,

          progress: 25,
        },
      );

      await preview(fileName);

      console.log("preview done");

      global.io?.emit(
        "progress",

        {
          assetId,

          progress: 50,
        },
      );

      await compress(fileName);

      console.log("compression done");

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

      console.log("JOB COMPLETED");
    },

    {
      concurrency: 4,

      connection: {
        host: process.env.REDIS_HOST,

        port: Number(process.env.REDIS_PORT),
      },
    },
  );

  worker.on(
    "ready",

    () => {
      console.log("BullMQ worker ready");
    },
  );

  worker.on(
    "error",

    console.error,
  );

  worker.on(
    "failed",

    console.error,
  );
})();
