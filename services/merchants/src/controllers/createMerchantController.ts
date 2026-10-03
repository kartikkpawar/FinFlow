import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import {
  authorizeMerchantCreation,
  createMerchant,
  getIdentity,
} from "../services/merchantService";
import { validateCreateMerchant } from "../schemas/merchant";

export async function createMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  await authorizeMerchantCreation(identity);
  const merchant = await createMerchant(
    validateCreateMerchant(req.body),
    identity,
  );
  return successResponse(res, merchant, STATUS_CODES.CREATED);
}
