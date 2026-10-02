import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler, httpLogger, logger, successResponse } from "@finflow/shared";
import { merchantRoutes } from "./routes/merchantRoutes";
import { gatewayAuth } from "./middleware/gatewayAuth";
import { processWebhookDeliveries } from "./services/webhookDeliveryService";

const PORT = process.env.MERCHANTS_SERVICE_PORT || 3003;
const app = express();

app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.get("/health", (_req, res) => successResponse(res, { service: "merchants-service" }));
app.use("/merchants", gatewayAuth, merchantRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`MERCHANTS-SERVICE: Listening on port: ${PORT}`);
  const worker = async () => {
    try { await processWebhookDeliveries(); } catch (error) { logger.error(error, "Webhook delivery worker failed"); }
  };
  void worker();
  setInterval(() => void worker(), 5_000);
});
