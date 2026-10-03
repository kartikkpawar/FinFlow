export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REFUND_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export type Payment = {
  id: number;
  merchantId: number;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string | null;
  customerId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  succeededAt?: string | null;
};

export type PaymentListResponse = {
  items: Payment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaymentAttempt = {
  id: number;
  paymentId: number;
  provider: string;
  providerPaymentId?: string | null;
  status: string;
  amount: number;
  failureCode?: string | null;
  failureMessage?: string | null;
  attemptNumber?: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentEvent = {
  id: number;
  paymentId: number;
  eventType: string;
  previousStatus?: PaymentStatus | null;
  newStatus?: PaymentStatus | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type Refund = {
  id: number;
  paymentId: number;
  amount: number;
  reason?: string | null;
  status: RefundStatus;
  providerRefundId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentInput = {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
};

export type CreateRefundInput = {
  amount: number;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type PaymentFilters = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  customerId?: string;
  reference?: string;
};
