import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { validateListPayments } from "../schemas/payment";
import {
  authorizePayment,
  getIdentity,
  getMerchantId,
  listPayments,
} from "../services/paymentService";

export async function listPaymentsController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "payment:read");
  const input = {
    ...validateListPayments(req.query as Record<string, unknown>),
    merchantId: getMerchantId(req),
  };
  return successResponse(res, await listPayments(input));
}
