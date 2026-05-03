const client = require("prom-client");

client.collectDefaultMetrics();

const jobsProcessed = new client.Counter({
  name: "creative_jobs_processed_total",

  help: "Total processed jobs",
});

const jobsFailed = new client.Counter({
  name: "creative_jobs_failed_total",

  help: "Total failed jobs",
});

module.exports = {
  client,

  jobsProcessed,

  jobsFailed,
};
