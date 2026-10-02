import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, revokeApiKey } from "../services/merchantManagementService";
import { parseManagedMerchantId, parseManagedResourceId } from "../schemas/management";
export async function deleteMerchantApiKeyController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:update"); return successResponse(res, await revokeApiKey(parseManagedMerchantId(req.params.merchantId), parseManagedResourceId(req.params.keyId, "keyId"), identity)); }
