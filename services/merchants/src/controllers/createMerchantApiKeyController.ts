import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  createApiKey,
} from "../services/merchantManagementService";
import { parseManagedMerchantId, validateApiKey } from "../schemas/management";
export async function createMerchantApiKeyController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  const input = validateApiKey(req.body);
  return successResponse(
    res,
    await createApiKey(
      parseManagedMerchantId(req.params.merchantId),
      identity,
      input.name,
      input.expiresAt,
    ),
    STATUS_CODES.CREATED,
  );
}
