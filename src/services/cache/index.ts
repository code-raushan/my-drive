import * as redis from "redis";
import config from "../../config";
import logger from "../../utils/logger";

const redisClient = redis.createClient({
  url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
});

redisClient.on("ready", () => {
  logger.info("Redis connected...");
});

redisClient.on("error", (err) => {
  logger.error("Failed to connect with redis ", err);
});

export default redisClient;