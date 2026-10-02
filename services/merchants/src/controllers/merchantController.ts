import type { Request, Response } from "express";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import {
  createMerchant,
  getIdentity,
  getMerchant,
  listMerchants,
  updateMerchant,
  updateMerchantStatus,
  authorizeMerchantPermission,
} from "../services/merchantService";
import {
  parseMerchantId,
  validateCreateMerchant,
  validateMerchantStatus,
  validateUpdateMerchant,
} from "../schemas/merchant";
import type { MerchantStatus } from "../types/merchant";

function pagination(req: Request) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
  if (!Number.isInteger(page) || !Number.isInteger(limit)) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "page and limit must be integers");
  }
  return { page, limit };
}

export async function createMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:write");
  const input = validateCreateMerchant(req.body);
  const merchant = await createMerchant(input);
  return successResponse(res, merchant, STATUS_CODES.CREATED);
}

export async function listMerchantsController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:read");
  const { page, limit } = pagination(req);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const status = typeof req.query.status === "string" ? req.query.status as MerchantStatus : undefined;
  const result = await listMerchants(identity, page, limit, search, status);
  return successResponse(res, result);
}

export async function getMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:read");
  const merchant = await getMerchant(parseMerchantId(req.params.merchantId), identity);
  return successResponse(res, merchant);
}

export async function updateMerchantController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:update");
  const merchant = await updateMerchant(
    parseMerchantId(req.params.merchantId),
    identity,
    validateUpdateMerchant(req.body),
  );
  return successResponse(res, merchant);
}

export async function updateMerchantStatusController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizeMerchantPermission(identity, "merchant:update");
  const merchant = await updateMerchantStatus(
    parseMerchantId(req.params.merchantId),
    identity,
    validateMerchantStatus(req.body).status,
  );
  return successResponse(res, merchant);
}
