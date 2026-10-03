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
import type { ServerResponse } from "node:http";
import { secureSession } from "./middlewares/secureSession";
import { secureAuth } from "./middlewares/authServiceMiddleware";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

const PORT = process.env.API_GATEWAY_PORT || 3001;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3002";
const MERCHANTS_SERVICE_URL =
  process.env.MERCHANTS_SERVICE_URL || "http://localhost:3003";
const PAYMENTS_SERVICE_URL =
  process.env.PAYMENTS_SERVICE_URL || "http://localhost:3005";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3004";

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
    const isLocalHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]" ||
      url.hostname === "::1";

    return (
      isLocalHost && (url.protocol === "http:" || url.protocol === "https:")
    );
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
    pathRewrite: (path) => `/auth${path}`,
    on: {
      error: (_error, _req, res) => {
        if (!("writeHead" in res)) return;

        const response = res as ServerResponse;
        if (response.headersSent) return;

        response.writeHead(502, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            success: false,
            message: "Auth service is unavailable",
          }),
        );
      },
    },
  }),
);

const merchantProxy = createProxyMiddleware({
  target: MERCHANTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    if (req.originalUrl.startsWith("/merchant-users")) return `/merchant-users${path}`;
    return `/merchants${path}`;
  },
  on: {
    error: (_error, _req, res) => {
      if (!("writeHead" in res)) return;

      const response = res as ServerResponse;
      if (response.headersSent) return;

      response.writeHead(502, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          success: false,
          message: "Merchant service is unavailable",
        }),
      );
    },
  },
});

const paymentProxy = createProxyMiddleware({
  target: PAYMENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/payments${path}`,
  on: {
    error: (_error, _req, res) => {
      if (!("writeHead" in res)) return;

      const response = res as ServerResponse;
      if (response.headersSent) return;

      response.writeHead(502, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          success: false,
          message: "Payment service is unavailable",
        }),
      );
    },
  },
});

app.use("/merchant-users", secureSession, merchantProxy);
app.use("/merchants", secureSession, merchantProxy);
app.use("/payments", secureSession, paymentProxy);

app.use((_req, _res, next) => {
  next(new AppError(400, "Route Not Found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API-GATEWAY-SERVICE: Listening on port: ${PORT}`);
});
