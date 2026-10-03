import express from "express";
import {
  errorHandler,
  httpLogger,
  logger,
  successResponse,
} from "@finflow/shared";
import { merchantRoutes } from "./routes/merchantRoutes";
import { listPlatformMerchantUsersController } from "./controllers/listPlatformMerchantUsersController";
import { resolveMerchantMembershipController } from "./controllers/resolveMerchantMembershipController";
import { gatewayAuth } from "./middleware/gatewayAuth";
import { processWebhookDeliveries } from "./services/webhookDeliveryService";
import { config } from "dotenv";
import { resolve } from "node:path";

const PORT = process.env.MERCHANTS_SERVICE_PORT || 3003;
const app = express();

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

app.use(express.json());
app.use(httpLogger);

app.get("/health", (_req, res) =>
  successResponse(res, { service: "merchants-service" }),
);
app.get(
  "/merchant-users/context",
  gatewayAuth,
  resolveMerchantMembershipController,
);
app.use("/merchant-users", gatewayAuth, listPlatformMerchantUsersController);
app.use("/merchants", gatewayAuth, merchantRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`MERCHANTS-SERVICE: Listening on port: ${PORT}`);
  const worker = async () => {
    try {
      await processWebhookDeliveries();
    } catch (error) {
      logger.error(error, "Webhook delivery worker failed");
    }
  };
  void worker();
  setInterval(() => void worker(), 5_000);
});
