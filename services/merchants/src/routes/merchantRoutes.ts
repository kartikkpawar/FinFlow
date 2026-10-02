import { Router } from "express";
import {
  createMerchantController,
  getMerchantController,
  listMerchantsController,
  updateMerchantController,
  updateMerchantStatusController,
} from "../controllers/merchantController";

export const merchantRoutes = Router();

merchantRoutes.post("/", createMerchantController);
merchantRoutes.get("/", listMerchantsController);
merchantRoutes.get("/:merchantId", getMerchantController);
merchantRoutes.patch("/:merchantId", updateMerchantController);
merchantRoutes.patch("/:merchantId/status", updateMerchantStatusController);
