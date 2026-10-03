import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  removeMerchantUser,
} from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  parseManagedResourceId,
} from "../schemas/management";
export async function deleteMerchantUserController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  await removeMerchantUser(
    parseManagedMerchantId(req.params.merchantId),
    parseManagedResourceId(req.params.userId, "userId"),
    identity,
  );
  return successResponse(res, { deleted: true });
}
