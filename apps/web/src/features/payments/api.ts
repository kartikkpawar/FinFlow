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

export function listPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.reference) params.set("reference", filters.reference);
  const query = params.toString();
  return apiFetch<PaymentListResponse>(`/payments${query ? `?${query}` : ""}`);
}

export function getPayment(paymentId: number) {
  return apiFetch<Payment>(`/payments/${paymentId}`);
}

export function createPayment(input: CreatePaymentInput) {
  return apiFetch<Payment>("/payments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey() },
    data: input,
  });
}

export function cancelPayment(paymentId: number) {
  return apiFetch<Payment>(`/payments/${paymentId}/cancel`, { method: "POST" });
}

export function listPaymentRefunds(paymentId: number) {
  return apiFetch<Refund[]>(`/payments/${paymentId}/refunds`);
}

export function getRefund(refundId: number) {
  return apiFetch<Refund>(`/refunds/${refundId}`);
}

export function createRefund(paymentId: number, input: CreateRefundInput) {
  return apiFetch<Refund>(`/payments/${paymentId}/refunds`, {
    method: "POST",
    data: input,
  });
}
