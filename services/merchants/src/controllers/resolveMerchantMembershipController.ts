import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import { db } from "../db";
import { merchantUsersTable } from "../db/schema";
import { getIdentity } from "../services/merchantService";

export async function resolveMerchantMembershipController(
  req: Request,
  res: Response,
) {
  const identity = getIdentity(req);
  const merchantId = Number(req.query.merchantId);

  if (!Number.isInteger(merchantId) || merchantId <= 0) {
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      "merchantId must be a positive integer",
    );
  }

  const [membership] = await db
    .select({
      merchantId: merchantUsersTable.merchantId,
      role: merchantUsersTable.role,
      status: merchantUsersTable.status,
    })
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, identity.userId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant access denied");
  }

  if (membership.status !== "ACTIVE") {
    throw new AppError(
      STATUS_CODES.FORBIDDEN,
      "Merchant membership is inactive",
    );
  }

  return successResponse(res, {
    merchantId: membership.merchantId,
    role: membership.role,
  });
}
