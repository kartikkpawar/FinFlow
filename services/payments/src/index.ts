import { config } from "dotenv";
import express from "express";
import { resolve } from "node:path";
import {
  AppError,
  errorHandler,
  httpLogger,
  logger,
  successResponse,
} from "@finflow/shared";
import { gatewayAuth } from "./middleware/gatewayAuth";
import { paymentRoutes } from "./routes/paymentRoutes";
import { refundRoutes } from "./routes/refundRoutes";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

const PORT = process.env.PAYMENTS_SERVICE_PORT || 3005;
const app = express();

app.use(express.json());
app.use(httpLogger);

app.get("/health", (_req, res) =>
  successResponse(res, { service: "payments-service" }),
);
app.use("/payments", gatewayAuth, paymentRoutes);
app.use("/refunds", gatewayAuth, refundRoutes);

app.use((_req, _res, next) => {
  next(new AppError(400, "Route Not Found"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`PAYMENTS-SERVICE: Listening on port: ${PORT}`);
});
