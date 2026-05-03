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

const { client } = require("../../shared/metrics");

if (cluster.isPrimary) {
  console.log("Primary:", process.pid);

  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }

  cluster.on(
    "exit",

    () => {
      cluster.fork();
    },
  );
} else {
  const app = express();

  const PORT = Number(process.env.PORT) || 3000;

  app.get(
    "/health",

    (req, res) => {
      res.json({
        status: "UP",

        pid: process.pid,
      });
    },
  );

  app.get(
    "/metrics",

    async (req, res) => {
      res.set(
        "Content-Type",

        client.register.contentType,
      );

      res.end(await client.register.metrics());
    },
  );

  app.get(
    "/memory",

    (req, res) => {
      res.json(process.memoryUsage());
    },
  );

  app.post(
    "/upload",

    (req, res) => {
      const fileName = crypto.randomUUID() + ".bin";

      const filePath = path.join(
        "uploads",

        fileName,
      );

      const stream = fs.createWriteStream(filePath);

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
    },
  );

  app.listen(
    PORT,

    () => {
      console.log(`Worker ${process.pid} listening on ${PORT}`);
    },
  );
}
