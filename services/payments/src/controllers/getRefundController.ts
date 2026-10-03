import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { parsePositiveId } from "../schemas/payment";
import { authorizePayment, getIdentity, getMerchantId } from "../services/paymentService";
import { getRefund } from "../services/refundService";

export async function getRefundController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "refund:read");
  const refund = await getRefund(parsePositiveId(req.params.refundId, "refundId"), getMerchantId(req));
  return successResponse(res, refund);
}
