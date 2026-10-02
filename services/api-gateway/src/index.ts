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

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

const CONFIGURED_FRONTEND_ORIGIN = normalizeOrigin(FRONTEND_URL);

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (normalizedOrigin === CONFIGURED_FRONTEND_ORIGIN) return true;

  try {
    const url = new URL(normalizedOrigin);
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return isLocalHost && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
    pathRewrite: (_path, req) => req.originalUrl,
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
    pathRewrite: (_path, req) => req.originalUrl,
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
