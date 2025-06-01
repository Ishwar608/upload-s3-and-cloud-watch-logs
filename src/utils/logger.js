const winston = require("winston");
require("winston-cloudwatch");
require("dotenv").config();

const { AWS_REGION, LOG_GROUP_NAME, LOG_STREAM_NAME } = process.env;

const LOG_STREAM = `${LOG_STREAM_NAME}-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}`;

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      timestamp: true,
      colorize: true,
      level: "info",
    }),
    new winston.transports.CloudWatch({
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM,
      awsRegion: AWS_REGION,
      jsonMessage: true,
    }),
  ],
});

module.exports = logger;
