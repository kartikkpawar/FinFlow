import { Router } from "express";
import { createMerchantController } from "../controllers/createMerchantController";
import { listMerchantsController } from "../controllers/listMerchantsController";
import { getMerchantController } from "../controllers/getMerchantController";
import { updateMerchantController } from "../controllers/updateMerchantController";
import { updateMerchantStatusController } from "../controllers/updateMerchantStatusController";

export const merchantRoutes = Router();

merchantRoutes.post("/", createMerchantController);
merchantRoutes.get("/", listMerchantsController);
merchantRoutes.get("/:merchantId", getMerchantController);
merchantRoutes.patch("/:merchantId", updateMerchantController);
merchantRoutes.patch("/:merchantId/status", updateMerchantStatusController);
