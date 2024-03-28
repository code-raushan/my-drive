import winston, { format } from "winston";
const { combine, timestamp, printf } = format;
// @ts-ignore
import CloudWatchTransport from "winston-aws-cloudwatch";
import config from "../../config";
import { getDateAsString } from "../date";

const myFormat = printf(({ level, message, timestamp }) => {
  return `${level} ${timestamp} : ${message}`;
});

const cloudwatchLogger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: config.CLOUDWATCH_LOG_GROUP_NAME,
      logStreamName: getDateAsString(),
      createLogGroup: true,
      createLogStream: true,
      submissionInterval: 2000,
      submissionRetryCount: 1,
      batchSize: 20,
      awsConfig: {
        accessKeyId: config.CLOUDWATCH_LOGS_ID,
        secretAccessKey: config.CLOUDWATCH_LOGS_SECRET,
        region: config.CLOUDWATCH_LOGS_REGION
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatLog: (item: any) =>
        `Date - ${getDateAsString()} ${item.level}: ${item.message} ${JSON.stringify(item.meta)}`
    })
  ],
});

export default cloudwatchLogger;