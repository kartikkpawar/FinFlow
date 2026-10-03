import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  updateSettings,
} from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  validateSettings,
} from "../schemas/management";
export async function updateMerchantSettingsController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  return successResponse(
    res,
    await updateSettings(
      parseManagedMerchantId(req.params.merchantId),
      identity,
      validateSettings(req.body),
    ),
  );
}
