import { Router } from "express";
import { getRefundController } from "../controllers/getRefundController";

export const refundRoutes = Router();

refundRoutes.get("/:refundId", getRefundController);
