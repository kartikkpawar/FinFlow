import type { Request, Response } from "express";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity, resolveMerchantMembership } from "../services/merchantService";

export async function resolveMerchantMembershipController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  const merchantId = Number(req.query.merchantId);

  if (!Number.isInteger(merchantId) || merchantId <= 0) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "merchantId must be a positive integer");
  }

  return successResponse(
    res,
    await resolveMerchantMembership(identity.userId, merchantId),
  );
}
