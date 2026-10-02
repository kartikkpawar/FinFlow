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
import { secureSession } from "./middlewares/secureSession";
import { secureAuth } from "./middlewares/authServiceMiddleware";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

const PORT = process.env.API_GATEWAY_PORT || 3001;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3002";
const MERCHANTS_SERVICE_URL =
  process.env.MERCHANTS_SERVICE_URL || "http://localhost:3003";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ALLOWED_ORIGINS = new Set([
  FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(httpLogger);

app.get("/health", (_req, res) => {
  return successResponse(res, { service: "api-gateway" });
});

app.use(
  "/auth",
  secureAuth,
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
    on: {
      error: (_error, _req, res) => {
        if (res.headersSent) return;
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Auth service is unavailable" }));
      },
    },
  }),
);

app.use(
  "/merchants",
  secureSession,
  createProxyMiddleware({
    target: MERCHANTS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/merchants${path}`,
    on: {
      error: (_error, _req, res) => {
        if (res.headersSent) return;
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Merchant service is unavailable" }));
      },
    },
  }),
);

app.use((_req, _res, next) => {
  next(new AppError(400, "Route Not Found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API-GATEWAY-SERVICE: Listening on port: ${PORT}`);
});
