import { Router } from "express";
import { createPaymentController } from "../controllers/createPaymentController";
import { getPaymentController } from "../controllers/getPaymentController";
import { listPaymentsController } from "../controllers/listPaymentsController";

export const paymentRoutes = Router();

paymentRoutes.post("/", createPaymentController);
paymentRoutes.get("/", listPaymentsController);
paymentRoutes.get("/:paymentId", getPaymentController);
