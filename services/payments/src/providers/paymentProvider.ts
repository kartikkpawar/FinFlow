export type PaymentProviderResult = {
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "PROCESSING";
  providerPaymentId?: string;
  failureCode?: string;
  failureMessage?: string;
  response?: Record<string, unknown>;
};

export type RefundProviderResult = {
  status: "SUCCEEDED" | "FAILED" | "PROCESSING";
  providerRefundId?: string;
  failureCode?: string;
  failureMessage?: string;
  response?: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: {
    paymentId: number;
    amount: number;
    currency: string;
    attemptNumber: number;
  }): Promise<PaymentProviderResult>;
  createRefund(input: {
    paymentId: number;
    refundId: number;
    amount: number;
    currency: string;
  }): Promise<RefundProviderResult>;
}
