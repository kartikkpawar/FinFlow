import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { listPlatformMerchantUsers } from "../services/merchantUserAdminService";

function positiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function listPlatformMerchantUsersController(req: Request, res: Response) {
  const identity = getIdentity(req);
  const page = positiveInt(req.query.page, 1);
  const limit = Math.min(100, positiveInt(req.query.limit, 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const merchantId = req.query.merchantId ? positiveInt(req.query.merchantId, 0) : undefined;

  return successResponse(
    res,
    await listPlatformMerchantUsers(identity, page, limit, search || undefined, merchantId || undefined),
  );
}
