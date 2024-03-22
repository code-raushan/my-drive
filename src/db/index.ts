import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import config from "../config";
import logger from "../utils/logger";
import { DB } from "./types";

export const pool = new Pool({
  host: config.PG_DATABASE_HOST,
  user: config.PG_DATABASE_USER,
  password: config.PG_DATABASE_PASSWORD,
  port: Number(config.PG_DATABASE_PORT),
  database: config.PG_DATABASE,
});

const dialect = new PostgresDialect({
  pool
});

export const db = new Kysely<DB>({ dialect });

export const waitForDBConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info("Database connected");
    client.release();
  } catch (error) {
    logger.error(error);
    logger.error("Database connection failed");
  }
};
