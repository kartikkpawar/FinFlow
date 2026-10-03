import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import { validateCreateRefund, parsePositiveId } from "../schemas/payment";
import { authorizePayment, getIdentity, getMerchantId } from "../services/paymentService";
import { createRefund } from "../services/refundService";

export async function createRefundController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "refund:create");
  const refund = await createRefund({
    ...validateCreateRefund(req.body),
    paymentId: parsePositiveId(req.params.paymentId, "paymentId"),
    merchantId: getMerchantId(req),
  });
  return successResponse(res, refund, STATUS_CODES.CREATED);
}
