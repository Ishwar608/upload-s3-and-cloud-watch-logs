// middleware/loggerMiddleware.js
// const logToCloudWatch = require("../cloudwatch/logger");

// const requestLogger = async (req, res, next) => {
//   await logToCloudWatch(`Incoming request: ${req.method} ${req.originalUrl}`);
//   next();
// };

const logger = require("../utils/logger"); // path to your logger.js
const os = require("os");

// Middleware to log requests and responses to CloudWatch
const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl } = req;
  const userAgent = req.get("user-agent") || "";
  const androidBuildNo = req.get("build-number") || "";
  const clientIp =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // Mask password if present
  const sanitizedBody = req.body?.password
    ? { ...req.body, password: "*********" }
    : req.body;

  const oldJson = res.json;
  res.json = (responseBody) => {
    const responseTime = Date.now() - startTime;
    const sizeKB = Buffer.byteLength(JSON.stringify(responseBody)) / 1024;

    const safeResponse =
      sizeKB > 256
        ? "This message is too large to be delivered to the cloudWatchLogs."
        : responseBody;

    const logEntry = {
      url: `${method} ${originalUrl} | IP: ${clientIp} | UA: ${userAgent} | Build: ${androidBuildNo} | ${responseTime}ms`,
      request: {
        body: sanitizedBody,
        token: req.headers.authorization || null,
      },
      response: {
        status: res.statusCode,
        resBody: safeResponse,
      },
      hostname: os.hostname(),
      timestamp: new Date().toISOString(),
    };

    logger.info(logEntry);
    return oldJson.call(res, responseBody);
  };

  next();
};

module.exports = loggerMiddleware;
