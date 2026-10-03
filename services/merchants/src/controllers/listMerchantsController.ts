import type { Request, Response } from "express";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import {
  authorizeMerchantPermission,
  getIdentity,
  listMerchants,
} from "../services/merchantService";
import { MERCHANT_STATUSES, type MerchantStatus } from "../types/merchant";

function pagination(req: Request) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));

  if (!Number.isInteger(page) || !Number.isInteger(limit)) {
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      "page and limit must be integers",
    );
  }

  return { page, limit };
}

function parseStatus(value: unknown): MerchantStatus | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== "string" ||
    !MERCHANT_STATUSES.includes(value as MerchantStatus)
  ) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "Invalid merchant status");
  }
  return value as MerchantStatus;
}

export async function listMerchantsController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:read");

  const { page, limit } = pagination(req);
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const status = parseStatus(req.query.status);
  const result = await listMerchants(identity, page, limit, search, status);

  return successResponse(res, result);
}
