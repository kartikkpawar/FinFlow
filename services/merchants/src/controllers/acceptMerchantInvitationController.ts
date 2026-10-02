import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { acceptInvitation, getIdentity } from "../services/merchantManagementService";
import { validateAcceptInvitation } from "../schemas/management";

export async function acceptMerchantInvitationController(req: Request, res: Response) {
  const identity = getIdentity(req);
  const input = validateAcceptInvitation(req.body);
  const result = await acceptInvitation(identity, input.token);
  return successResponse(res, result, STATUS_CODES.OK);
}
