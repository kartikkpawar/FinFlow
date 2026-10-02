import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import {
  authorizeMerchantPermission,
  getIdentity,
  updateMerchant,
} from "../services/merchantService";
import { parseMerchantId, validateUpdateMerchant } from "../schemas/merchant";

export async function updateMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:update");

  const merchant = await updateMerchant(
    parseMerchantId(req.params.merchantId),
    identity,
    validateUpdateMerchant(req.body),
  );

  return successResponse(res, merchant);
}
