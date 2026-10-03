"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPayment,
  createPayment,
  createRefund,
  getPayment,
  listPaymentRefunds,
  listPayments,
} from "./api";
import type { CreatePaymentInput, CreateRefundInput, PaymentFilters } from "./types";

export const paymentKeys = {
  all: ["payments"] as const,
  list: (filters: PaymentFilters) => ["payments", "list", filters] as const,
  detail: (id: number) => ["payments", "detail", id] as const,
  refunds: (id: number) => ["payments", "refunds", id] as const,
};

export function hasActiveMerchant() {
  return typeof window !== "undefined" && Boolean(window.localStorage.getItem("finflow_merchant_id"));
}

export function usePayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => listPayments(filters),
    enabled: hasActiveMerchant(),
  });
}

export function usePayment(paymentId: number) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => getPayment(paymentId),
    enabled: Number.isInteger(paymentId) && paymentId > 0 && hasActiveMerchant(),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentKeys.all }),
  });
}

export function useCancelPayment(paymentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelPayment(paymentId),
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentKeys.detail(paymentId), payment);
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function usePaymentRefunds(paymentId: number) {
  return useQuery({
    queryKey: paymentKeys.refunds(paymentId),
    queryFn: () => listPaymentRefunds(paymentId),
    enabled: Number.isInteger(paymentId) && paymentId > 0 && hasActiveMerchant(),
  });
}

export function useCreateRefund(paymentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRefundInput) => createRefund(paymentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(paymentId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.refunds(paymentId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
