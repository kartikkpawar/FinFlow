import type { Request, Response } from "express";
import { STATUS_CODES, successResponse } from "@finflow/shared";
import {
  hashRequest,
  validateCreatePayment,
  validateIdempotencyKey,
} from "../schemas/payment";
import {
  authorizePayment,
  createPayment,
  getIdentity,
  getMerchantId,
} from "../services/paymentService";

export async function createPaymentController(req: Request, res: Response) {
  const identity = getIdentity(req);
  authorizePayment(identity, "payment:create");
  const merchantId = getMerchantId(req);
  const input = { ...validateCreatePayment(req.body), merchantId };
  const idempotencyKey = validateIdempotencyKey(
    req.header("Idempotency-Key") ?? undefined,
  );
  const result = await createPayment(input, idempotencyKey, hashRequest(input));
  return successResponse(
    res,
    result.response,
    result.statusCode ?? STATUS_CODES.CREATED,
  );
}
