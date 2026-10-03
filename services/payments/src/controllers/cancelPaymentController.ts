import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";
import { parsePositiveId } from "../schemas/payment";
import {
  authorizePayment,
  cancelPayment,
  getIdentity,
  getMerchantId,
} from "../services/paymentService";

export async function cancelPaymentController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "payment:update");
  const payment = await cancelPayment(
    parsePositiveId(req.params.paymentId, "paymentId"),
    getMerchantId(req),
  );
  return successResponse(res, payment);
}
