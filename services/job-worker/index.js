require("dotenv").config();

const { Worker } = require("bullmq");

const { Worker: Thread } = require("worker_threads");

const path = require("path");

const logger = require("../../shared/logger");

const bus = require("../../shared/events");

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

    bus.emit(
      "processing.completed",

      {
        fileName,
      },
    );
  },

  {
    connection: {
      host: process.env.REDIS_HOST,

      port: process.env.REDIS_PORT,
    },
  },
);
