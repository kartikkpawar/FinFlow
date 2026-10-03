import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import {
  assertPermission,
  listWebhooks,
} from "../services/merchantManagementService";
import { parseManagedMerchantId } from "../schemas/management";
export async function listMerchantWebhooksController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  assertPermission(identity, "merchant:read");
  return successResponse(
    res,
    await listWebhooks(parseManagedMerchantId(req.params.merchantId), identity),
  );
}
