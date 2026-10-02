import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import {
  authorizeMerchantPermission,
  getIdentity,
  getMerchant,
} from "../services/merchantService";
import { parseMerchantId } from "../schemas/merchant";

export async function getMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:read");

  const merchant = await getMerchant(parseMerchantId(req.params.merchantId), identity);

  return successResponse(res, merchant);
}
