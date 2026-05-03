require("dotenv").config();

const cluster = require("cluster");

cluster.schedulingPolicy = cluster.SCHED_RR;

const os = require("os");

const express = require("express");

const fs = require("fs");

const path = require("path");

const crypto = require("crypto");

const queue = require("../../shared/queue");

const logger = require("../../shared/logger");

process.on(
  "uncaughtException",

  console.error,
);

process.on(
  "unhandledRejection",

  console.error,
);

if (cluster.isPrimary) {
  console.log("Primary:", process.pid);

  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }

  cluster.on(
    "exit",

    (worker) => {
      console.log(`Worker crashed: ${worker.process.pid}`);

      cluster.fork();
    },
  );
} else {
  (async () => {
    try {
      const app = express();

      const PORT = Number(process.env.PORT) || 3000;

      app.post(
        "/upload",

        async (req, res) => {
          const fileName = crypto.randomUUID() + ".bin";

          const filePath = path.join(
            "uploads",

            fileName,
          );

          const stream = fs.createWriteStream(filePath);

          req.on(
            "data",

            (chunk) => {
              logger.info({
                pid: process.pid,

                chunk: chunk.length,
              });
            },
          );

          req.pipe(stream);

          req.on(
            "end",

            async () => {
              await queue.add(
                "asset-processing",

                {
                  fileName,
                },

                {
                  jobId: fileName,
                },
              );

              logger.info({
                message: "Job queued",

                fileName,
              });

              res.send("uploaded");
            },
          );

          req.on(
            "error",

            console.error,
          );
        },
      );

      app.listen(
        PORT,

        () => {
          console.log(`Worker ${process.pid} listening on ${PORT}`);
        },
      );
    } catch (error) {
      console.error(error);
    }
  })();
}
