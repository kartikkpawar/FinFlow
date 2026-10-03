import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  deleteWebhook,
} from "../services/merchantManagementService";
import {
  parseManagedMerchantId,
  parseManagedResourceId,
} from "../schemas/management";
export async function deleteMerchantWebhookController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:update");
  return successResponse(
    res,
    await deleteWebhook(
      parseManagedMerchantId(req.params.merchantId),
      parseManagedResourceId(req.params.webhookId, "webhookId"),
      identity,
    ),
  );
}
