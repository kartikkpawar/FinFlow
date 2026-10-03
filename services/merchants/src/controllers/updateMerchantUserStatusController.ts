import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission } from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  parseManagedResourceId,
  validateMerchantUserUpdate,
} from "../schemas/management";
import { updateMerchantUserStatus } from "../services/merchantUserStatusService";

export async function updateMerchantUserStatusController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  const { status } = validateMerchantUserUpdate(req.body);
  if (!status) throw new Error("status is required");
  return successResponse(
    res,
    await updateMerchantUserStatus(
      parseManagedMerchantId(req.params.merchantId),
      parseManagedResourceId(req.params.userId, "userId"),
      identity,
      status,
    ),
  );
}
