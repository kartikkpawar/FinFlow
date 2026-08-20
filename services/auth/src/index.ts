import "dotenv/config";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  successResponse,
} from "@finflow/shared";

import express from "express";

const PORT = process.env.PORT || 3002;

const app = express();

app.use(httpLogger);
app.use(express.json());

app.get("/health", (req, res) => {
  successResponse(res, { service: "auth-service" });
});

app.use((_req, _res, next) => {
  next(new AppError(400, "Route Not Found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`AUTH-SERVICE: Listening on port: ${PORT}`);
});
