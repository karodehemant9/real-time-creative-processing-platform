require("dotenv").config();

const { Queue } = require("bullmq");

module.exports = new Queue(
  "creative-jobs",

  {
    connection: {
      host: process.env.REDIS_HOST,

      port: process.env.REDIS_PORT,
    },
  },
);
