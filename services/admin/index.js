require("dotenv").config();

const express = require("express");

const { createBullBoard } = require("@bull-board/api");

const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");

const { ExpressAdapter } = require("@bull-board/express");

const queue = require("../../shared/queue");

const app = express();

const adapter = new ExpressAdapter();

adapter.setBasePath("/admin");

createBullBoard({
  queues: [new BullMQAdapter(queue)],

  serverAdapter: adapter,
});

app.use(
  "/admin",

  adapter.getRouter(),
);

app.listen(
  4000,

  () => {
    console.log("Admin UI on 4000");
  },
);
