import { Router } from "express";
import { createPaymentController } from "../controllers/createPaymentController";
import { getPaymentController } from "../controllers/getPaymentController";
import { listPaymentsController } from "../controllers/listPaymentsController";
import { cancelPaymentController } from "../controllers/cancelPaymentController";
import { createRefundController } from "../controllers/createRefundController";
import { listPaymentRefundsController } from "../controllers/listPaymentRefundsController";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPaymentController);
paymentRoutes.get("/", listPaymentsController);
paymentRoutes.get("/:paymentId", getPaymentController);
paymentRoutes.post("/:paymentId/cancel", cancelPaymentController);
paymentRoutes.post("/:paymentId/refunds", createRefundController);
paymentRoutes.get("/:paymentId/refunds", listPaymentRefundsController);
