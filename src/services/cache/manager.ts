import redisClient from '.';
import config from '../../config';

// const getCache = async (key: string) => {
//   await redisClient.get(key);
// };

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const setCache = async (key: string, data: any, duration: number) => {
//   await redisClient.setEx(key, duration, JSON.stringify(data));
// };

// const clearCache = async (key: string) => {
//   await redisClient.del(key);
// };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setNxInRedis = async (key: string, value: any) => {
  await redisClient.setNX(key, JSON.stringify(value));
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function CacheManager<T, J = unknown>(prefix: string, duration: number) { // duration in seconds
  const generateKey = (prefix: string, values: T) => {
    return `${config.SERVER_NAME}_${config.NODE_ENV}_${prefix}_${Object.values(values as unknown as Record<string, string>).sort().join('_')}`;
  };
  return {
    get: async (values: T): Promise<J> => {
      const key = generateKey(prefix, values);
      const data = await redisClient.get(key) as string;
      return data as J;
    },
    set: async (keys: T, data: J) => {
      const key = generateKey(prefix, keys);
      await redisClient.setEx(key, duration, typeof data == 'string' ? data : JSON.stringify(data));
    },
    remove: async (keys: T) => {
      const key = generateKey(prefix, keys);
      await redisClient.del(key);
    },
    setNx: async (keys: T, data: unknown) => {
      const key = generateKey(prefix, keys);
      return await setNxInRedis(key, data);
    },
  };
}

export default CacheManager;