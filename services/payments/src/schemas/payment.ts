import { createHash } from "node:crypto";

export const PAYMENT_STATUSES = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REFUND_STATUSES = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export type CreatePaymentInput = {
  merchantId: number;
  reference: string;
  amount: number;
  currency: string;
  description?: string;
  customerId?: string;
  metadata: Record<string, unknown>;
};

export type ListPaymentsInput = {
  merchantId: number;
  page: number;
  limit: number;
  status?: PaymentStatus;
  customerId?: string;
  reference?: string;
};

export type CreateRefundInput = {
  merchantId: number;
  paymentId: number;
  amount: number;
  reason?: string;
  metadata: Record<string, unknown>;
};

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function optionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) throw new Error(`${field} must be at most ${maxLength} characters`);
  return normalized;
}

function metadata(value: unknown): Record<string, unknown> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("metadata must be an object");
  return value as Record<string, unknown>;
}

export function validateCreatePayment(body: unknown): Omit<CreatePaymentInput, "merchantId"> {
  if (!body || typeof body !== "object") throw new Error("request body is required");
  const input = body as Record<string, unknown>;
  const amount = positiveInteger(input.amount, "amount");
  const reference = optionalString(input.reference, "reference", 255);
  if (!reference) throw new Error("reference is required");
  const currency = optionalString(input.currency, "currency", 3)?.toUpperCase();
  if (!currency || !/^[A-Z]{3}$/.test(currency)) throw new Error("currency must be a valid 3-letter code");

  return {
    amount,
    currency,
    reference,
    description: optionalString(input.description, "description", 1000),
    customerId: optionalString(input.customerId, "customerId", 255),
    metadata: metadata(input.metadata),
  };
}

export function validateListPayments(query: Record<string, unknown>): Omit<ListPaymentsInput, "merchantId"> {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) throw new Error("page must be a positive integer");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("limit must be between 1 and 100");

  const status = query.status as string | undefined;
  if (status && !PAYMENT_STATUSES.includes(status as PaymentStatus)) throw new Error(`status must be one of: ${PAYMENT_STATUSES.join(", ")}`);

  return {
    page,
    limit,
    status: status as PaymentStatus | undefined,
    customerId: optionalString(query.customerId, "customerId", 255),
    reference: optionalString(query.reference, "reference", 255),
  };
}

export function validateCreateRefund(body: unknown): Omit<CreateRefundInput, "merchantId" | "paymentId"> {
  if (!body || typeof body !== "object") throw new Error("request body is required");
  const input = body as Record<string, unknown>;
  return {
    amount: positiveInteger(input.amount, "amount"),
    reason: optionalString(input.reason, "reason", 500),
    metadata: metadata(input.metadata),
  };
}

export function parsePositiveId(value: string | undefined, field: string): number {
  const id = Number(value);
  return positiveInteger(id, field);
}

export function validateIdempotencyKey(value: string | undefined): string {
  const key = value?.trim();
  if (!key) throw new Error("Idempotency-Key header is required");
  if (key.length > 255) throw new Error("Idempotency-Key must be at most 255 characters");
  return key;
}

export function hashRequest(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
