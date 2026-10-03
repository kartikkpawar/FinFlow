import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { parsePositiveId } from "../schemas/payment";
import { authorizePayment, getIdentity, getMerchantId } from "../services/paymentService";
import { listPaymentRefunds } from "../services/refundService";

export async function listPaymentRefundsController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "refund:read");
  const refunds = await listPaymentRefunds(parsePositiveId(req.params.paymentId, "paymentId"), getMerchantId(req));
  return successResponse(res, refunds);
}
