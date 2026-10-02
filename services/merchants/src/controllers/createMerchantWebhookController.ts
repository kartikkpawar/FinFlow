import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, createWebhook } from "../services/merchantManagementService";
import { parseManagedMerchantId, validateWebhook } from "../schemas/management";
export async function createMerchantWebhookController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:update"); return successResponse(res, await createWebhook(parseManagedMerchantId(req.params.merchantId), identity, validateWebhook(req.body)), STATUS_CODES.CREATED); }
