import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import {
  authorizeMerchantPermission,
  createMerchant,
  getIdentity,
} from "../services/merchantService";
import { validateCreateMerchant } from "../schemas/merchant";

export async function createMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:write");

  const input = validateCreateMerchant(req.body);
  const merchant = await createMerchant(input);

  return successResponse(res, merchant, STATUS_CODES.CREATED);
}
