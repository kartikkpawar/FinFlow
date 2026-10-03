import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { parsePositiveId } from "../schemas/payment";
import { authorizePayment, getIdentity, getMerchantId, getPayment } from "../services/paymentService";

export async function getPaymentController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "payment:read");
  const payment = await getPayment(parsePositiveId(req.params.paymentId, "paymentId"), getMerchantId(req));
  return successResponse(res, payment);
}
