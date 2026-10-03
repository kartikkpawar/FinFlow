import { apiFetch } from "@/lib/api";
import type {
  CreatePaymentInput,
  CreateRefundInput,
  Payment,
  PaymentFilters,
  PaymentListResponse,
  Refund,
} from "./types";

function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function merchantHeaders() {
  if (typeof window === "undefined") return undefined;
  const merchantId = window.localStorage.getItem("finflow_merchant_id");
  return merchantId ? { "x-merchant-id": merchantId } : undefined;
}

function requireMerchantId() {
  const merchantId = typeof window !== "undefined"
    ? window.localStorage.getItem("finflow_merchant_id")
    : null;

  if (!merchantId) {
    throw new Error("Select a merchant before accessing payments.");
  }

  return merchantId;
}

export function listPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.reference) params.set("reference", filters.reference);
  const query = params.toString();
  requireMerchantId();
  return apiFetch<PaymentListResponse>(`/payments${query ? `?${query}` : ""}`, {
    headers: merchantHeaders(),
  });
}

export function getPayment(paymentId: number) {
  requireMerchantId();
  return apiFetch<Payment>(`/payments/${paymentId}`, {
    headers: merchantHeaders(),
  });
}

export function createPayment(input: CreatePaymentInput) {
  requireMerchantId();
  return apiFetch<Payment>("/payments", {
    method: "POST",
    headers: {
      ...merchantHeaders(),
      "Idempotency-Key": idempotencyKey(),
    },
    data: input,
  });
}

export function cancelPayment(paymentId: number) {
  requireMerchantId();
  return apiFetch<Payment>(`/payments/${paymentId}/cancel`, {
    method: "POST",
    headers: merchantHeaders(),
  });
}

export function listPaymentRefunds(paymentId: number) {
  requireMerchantId();
  return apiFetch<Refund[]>(`/payments/${paymentId}/refunds`, {
    headers: merchantHeaders(),
  });
}

export function getRefund(refundId: number) {
  requireMerchantId();
  return apiFetch<Refund>(`/refunds/${refundId}`, {
    headers: merchantHeaders(),
  });
}

export function createRefund(paymentId: number, input: CreateRefundInput) {
  requireMerchantId();
  return apiFetch<Refund>(`/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: merchantHeaders(),
    data: input,
  });
}
