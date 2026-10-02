import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, createInvitation } from "../services/merchantManagementService";
import { parseManagedMerchantId, validateInvitation } from "../schemas/management";
export async function createMerchantInvitationController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:update"); const input = validateInvitation(req.body); return successResponse(res, await createInvitation(parseManagedMerchantId(req.params.merchantId), identity, input.email, input.role), STATUS_CODES.CREATED); }
