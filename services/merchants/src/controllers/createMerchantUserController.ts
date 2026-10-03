import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  addMerchantUser,
  assertPermission,
} from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  validateMerchantUser,
} from "../schemas/management";
export async function createMerchantUserController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  const id = parseManagedMerchantId(req.params.merchantId);
  const input = validateMerchantUser(req.body);
  return successResponse(
    res,
    await addMerchantUser(id, identity, input.userId, input.role),
    STATUS_CODES.CREATED,
  );
}
