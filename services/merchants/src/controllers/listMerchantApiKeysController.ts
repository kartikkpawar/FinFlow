import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, listApiKeys } from "../services/merchantManagementService";
import { parseManagedMerchantId } from "../schemas/management";
export async function listMerchantApiKeysController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:read"); return successResponse(res, await listApiKeys(parseManagedMerchantId(req.params.merchantId), identity)); }
