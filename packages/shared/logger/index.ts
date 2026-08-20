import { pinoHttp } from "pino-http";
import pino from "pino";

export const logger = pino({
  level: "info",
});

export const httpLogger = pinoHttp({
  logger,
});
