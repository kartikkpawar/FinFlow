import type { Request, Response } from "express";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import { resolveMerchantMembership } from "../services/merchantService";

export async function resolveMerchantMembershipController(
  req: Request,
  res: Response,
) {
  const userId = Number(req.headers["x-user-id"]);
  const merchantId = Number(req.query.merchantId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError(STATUS_CODES.UNAUTHORIZED, "Invalid user identity");
  }

  if (!Number.isInteger(merchantId) || merchantId <= 0) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "merchantId must be a positive integer");
  }

  return successResponse(res, await resolveMerchantMembership(userId, merchantId));
}
