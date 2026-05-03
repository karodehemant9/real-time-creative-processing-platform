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

bus.on("processing.started", console.log);

bus.on("checksum.generated", console.log);

bus.on("preview.generated", console.log);

bus.on("compression.completed", console.log);

bus.on("metadata.extracted", console.log);

bus.on("processing.completed", console.log);

const worker = new Worker(
  "creative-jobs",

  async (job) => {
    const { fileName } = job.data;

    if (idempotency.exists(fileName)) {
      logger.warn({
        message: "Already processed",

        fileName,
      });

      return;
    }

    bus.emit(
      "processing.started",

      {
        fileName,
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

    bus.emit(
      "checksum.generated",

      checksum,
    );

    await job.updateProgress(25);

    if (Math.random() < 0.3) {
      throw new Error("Random failure");
    }

    await preview(fileName);

    bus.emit(
      "preview.generated",

      {
        fileName,
      },
    );

    await job.updateProgress(50);

    await compress(fileName);

    bus.emit(
      "compression.completed",

      {
        fileName,
      },
    );

    await job.updateProgress(75);

    const info = metadata(fileName);

    bus.emit(
      "metadata.extracted",

      info,
    );

    await job.updateProgress(100);

    idempotency.mark(fileName);

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
    logger.error({
      message: "Job failed",

      jobId: job.id,

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
