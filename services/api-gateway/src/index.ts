import { config } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  successResponse,
} from "@finflow/shared";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

const PORT = process.env.API_GATEWAY_PORT || 3001;

// Services config urls
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3002";

const app = express();

app.use(helmet());
app.use(cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use(httpLogger);

app.get("/health", (req, res) => {
  successResponse(res, { service: "auth-service" });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
  }),
);

app.use((_req, _res, next) => {
  next(new AppError(400, "Route Not Found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API-GATEWAY-SERVICE: Listening on port: ${PORT}`);
});
