require("dotenv").config();

const cluster = require("cluster");

const os = require("os");

const express = require("express");

const cors = require("cors");

const http = require("http");

const { Server } = require("socket.io");

const fs = require("fs");

const path = require("path");

const crypto = require("crypto");

const queue = require("../../shared/queue");

const connectDB = require("../../shared/db");

const Asset = require("../../shared/db/asset-model");

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  (async () => {
    await connectDB();

    const app = express();

    app.use(
      cors({
        origin: "*",
      }),
    );

    app.use(express.json());

    const server = http.createServer(app);

    const io = new Server(
      server,

      {
        cors: {
          origin: "*",
        },
      },
    );

    global.io = io;

    app.post(
      "/upload",

      async (req, res) => {
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
            const asset = await Asset.create({
              fileName,

              status: "queued",
            });

            await queue.add(
              "asset-processing",

              {
                assetId: asset.id,

                fileName,
              },
            );

            res.json({
              assetId: asset.id,
            });
          },
        );
      },
    );

    app.get(
      "/assets",

      async (req, res) => {
        const assets = await Asset.find()

          .sort({
            createdAt: -1,
          });

        res.json(assets);
      },
    );

    app.get(
      "/assets/:id",

      async (req, res) => {
        res.json(await Asset.findById(req.params.id));
      },
    );

    app.delete(
      "/assets/:id",

      async (req, res) => {
        await Asset.findByIdAndDelete(req.params.id);

        res.send("deleted");
      },
    );

    server.listen(
      3000,

      () => {
        console.log(`API ${process.pid}`);
      },
    );
  })();
}
