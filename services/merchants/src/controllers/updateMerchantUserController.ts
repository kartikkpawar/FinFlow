import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  updateMerchantUser,
} from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  parseManagedResourceId,
  validateMerchantUserUpdate,
} from "../schemas/management";
export async function updateMerchantUserController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  return successResponse(
    res,
    await updateMerchantUser(
      parseManagedMerchantId(req.params.merchantId),
      parseManagedResourceId(req.params.userId, "userId"),
      identity,
      validateMerchantUserUpdate(req.body).role,
    ),
  );
}
