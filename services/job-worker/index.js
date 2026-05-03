require("dotenv").config();

const { Worker } = require("bullmq");

const { Worker: Thread } = require("worker_threads");

const path = require("path");

const logger = require("../../shared/logger");

const bus = require("../../shared/events");

const preview = require("./preview-generator");

const compress = require("./compress-file");

const metadata = require("./get-metadata");

bus.on(
  "processing.started",

  (payload) => {
    console.log(
      "processing.started",

      payload,
    );
  },
);

bus.on(
  "checksum.generated",

  (payload) => {
    console.log(
      "checksum.generated",

      payload,
    );
  },
);

bus.on(
  "preview.generated",

  (payload) => {
    console.log(
      "preview.generated",

      payload,
    );
  },
);

bus.on(
  "compression.completed",

  (payload) => {
    console.log(
      "compression.completed",

      payload,
    );
  },
);

bus.on(
  "metadata.extracted",

  (payload) => {
    console.log(
      "metadata.extracted",

      payload,
    );
  },
);

bus.on(
  "processing.completed",

  (payload) => {
    console.log(
      "processing.completed",

      payload,
    );
  },
);

new Worker(
  "creative-jobs",

  async (job) => {
    const { fileName } = job.data;

    try {
      bus.emit(
        "processing.started",

        {
          fileName,
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

      bus.emit(
        "checksum.generated",

        checksum,
      );

      logger.info({
        message: "Checksum generated",

        checksum,
      });

      await preview(fileName);

      bus.emit(
        "preview.generated",

        {
          fileName,
        },
      );

      await compress(fileName);

      bus.emit(
        "compression.completed",

        {
          fileName,
        },
      );

      const info = metadata(fileName);

      bus.emit(
        "metadata.extracted",

        info,
      );

      bus.emit(
        "processing.completed",

        {
          fileName,
        },
      );

      logger.info({
        message: "Asset processing completed",

        fileName,
      });
    } catch (error) {
      logger.error({
        message: "Asset processing failed",

        fileName,

        error: error.message,
      });

      throw error;
    }
  },

  {
    connection: {
      host: process.env.REDIS_HOST,

      port: process.env.REDIS_PORT,
    },

    concurrency: 4,
  },
);
