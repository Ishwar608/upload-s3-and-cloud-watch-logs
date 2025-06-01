const {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
require("dotenv").config();

const { AWS_REGION, LOG_GROUP_NAME, LOG_STREAM_NAME } = process.env;

const cloudWatchLogs = new CloudWatchLogsClient({
  region: AWS_REGION,
});

const LOG_GROUP = LOG_GROUP_NAME;
const LOG_STREAM = `${LOG_STREAM_NAME}-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}`;

let sequenceToken;

// Setup function to initialize group/stream and fetch the sequence token
async function setupCloudWatch() {
  try {
    await cloudWatchLogs.send(
      new CreateLogGroupCommand({ logGroupName: LOG_GROUP })
    );
  } catch (err) {
    if (err.name !== "ResourceAlreadyExistsException") {
      console.error("Error creating log group:", err);
    }
  }

  try {
    await cloudWatchLogs.send(
      new CreateLogStreamCommand({
        logGroupName: LOG_GROUP,
        logStreamName: LOG_STREAM,
      })
    );
  } catch (err) {
    if (err.name !== "ResourceAlreadyExistsException") {
      console.error("Error creating log stream:", err);
    }
  }

  try {
    const describe = await cloudWatchLogs.send(
      new DescribeLogStreamsCommand({
        logGroupName: LOG_GROUP,
        logStreamNamePrefix: LOG_STREAM,
      })
    );

    const stream = describe.logStreams.find(
      (s) => s.logStreamName === LOG_STREAM
    );
    sequenceToken = stream?.uploadSequenceToken || null;
  } catch (err) {
    console.error("Error describing log stream:", err);
  }
}

async function logToCloudWatch(message) {
  try {
    if (!sequenceToken) {
      await setupCloudWatch();
    }

    const timestamp = Date.now();
    const input = {
      logEvents: [{ message, timestamp }],
      logGroupName: LOG_GROUP,
      logStreamName: LOG_STREAM,
      sequenceToken,
    };

    const response = await cloudWatchLogs.send(new PutLogEventsCommand(input));
    sequenceToken = response.nextSequenceToken;
  } catch (err) {
    console.error("CloudWatch logging failed:", err);
  }
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.CloudWatch({
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM_NAME,
      awsRegion: AWS_REGION,
      jsonMessage: true,
    }),
  ],
});

module.exports = { logToCloudWatch, logger };
