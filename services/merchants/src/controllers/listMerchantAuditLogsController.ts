import type { Request, Response } from "express";
import { AppError, STATUS_CODES, successResponse } from "@finflow/shared";
import { getIdentity } from "../services/merchantService";
import { assertPermission, listAuditLogs } from "../services/merchantManagementService";
import { parseManagedMerchantId } from "../schemas/management";
export async function listMerchantAuditLogsController(req: Request, res: Response) { const identity = getIdentity(req); assertPermission(identity, "merchant:read"); const page = Number(req.query.page ?? 1); const limit = Number(req.query.limit ?? 50); if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError(STATUS_CODES.BAD_REQUEST, "page and limit must be valid integers"); return successResponse(res, await listAuditLogs(parseManagedMerchantId(req.params.merchantId), identity, page, limit)); }
