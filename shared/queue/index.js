require("dotenv").config();

const { Queue } = require("bullmq");

module.exports = new Queue(
  "creative-jobs",

  {
    connection: {
      host: process.env.REDIS_HOST,

      port: process.env.REDIS_PORT,
    },

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",

        delay: 2000,
      },

      removeOnComplete: false,

      removeOnFail: false,
    },
  },
);
