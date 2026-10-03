import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import {
  authorizeMerchantPermission,
  getIdentity,
  updateMerchantStatus,
} from "../services/merchantService";
import { parseMerchantId, validateMerchantStatus } from "../schemas/merchant";

export async function updateMerchantStatusController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:update");

  const merchant = await updateMerchantStatus(
    parseMerchantId(req.params.merchantId),
    identity,
    validateMerchantStatus(req.body).status,
  );

  return successResponse(res, merchant);
}
