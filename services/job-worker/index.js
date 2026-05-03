require("dotenv").config();

const { Worker } = require("bullmq");

const { Worker: Thread } = require("worker_threads");

const path = require("path");

const logger = require("../../shared/logger");

const bus = require("../../shared/events");

const preview = require("./preview-generator");

const compress = require("./compress-file");

const metadata = require("./get-metadata");

const idempotency = require("./idempotency");

const {
  jobsProcessed,

  jobsFailed,
} = require("../../shared/metrics");

const worker = new Worker(
  "creative-jobs",

  async (job) => {
    const { fileName } = job.data;

    if (idempotency.exists(fileName)) {
      return;
    }

    bus.emit(
      "processing.started",

      {
        fileName,
      },
    );

    await new Promise((resolve) => {
      setTimeout(
        resolve,

        5000,
      );
    });

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

    bus.emit(
      "checksum.generated",

      checksum,
    );

    await preview(fileName);

    await compress(fileName);

    metadata(fileName);

    idempotency.mark(fileName);

    jobsProcessed.inc();

    logger.info({
      message: "Asset processed",

      fileName,
    });
  },

  {
    concurrency: 4,

    connection: {
      host: process.env.REDIS_HOST,

      port: process.env.REDIS_PORT,
    },
  },
);

worker.on(
  "failed",

  (job, error) => {
    jobsFailed.inc();

    logger.error({
      message: "Job failed",

      error: error.message,
    });
  },
);

process.on(
  "SIGINT",

  async () => {
    logger.info({
      message: "Graceful shutdown",
    });

    await worker.close();

    process.exit(0);
  },
);
