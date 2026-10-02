import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, updateWebhook } from "../services/merchantManagementService";
import { parseManagedMerchantId, parseManagedResourceId, validateWebhookUpdate } from "../schemas/management";
export async function updateMerchantWebhookController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:update"); return successResponse(res, await updateWebhook(parseManagedMerchantId(req.params.merchantId), parseManagedResourceId(req.params.webhookId, "webhookId"), identity, validateWebhookUpdate(req.body))); }
