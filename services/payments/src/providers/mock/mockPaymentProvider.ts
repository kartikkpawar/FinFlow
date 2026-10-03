import { randomUUID } from "node:crypto";
import type {
  PaymentProvider,
  PaymentProviderResult,
  RefundProviderResult,
} from "../paymentProvider";
import {
  MOCK_PAYMENT_SCENARIO,
  MOCK_REFUND_SCENARIO,
} from "./mockProviderScenarios";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: {
    paymentId: number;
    amount: number;
    currency: string;
    attemptNumber: number;
  }): Promise<PaymentProviderResult> {
    switch (MOCK_PAYMENT_SCENARIO) {
      case "PENDING":
        return {
          status: "PENDING",
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "INSUFFICIENT_FUNDS":
        return {
          status: "FAILED",
          failureCode: "INSUFFICIENT_FUNDS",
          failureMessage: "Insufficient funds",
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "CARD_DECLINED":
        return {
          status: "FAILED",
          failureCode: "CARD_DECLINED",
          failureMessage: "Payment method was declined",
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "INVALID_PAYMENT_METHOD":
        return {
          status: "FAILED",
          failureCode: "INVALID_PAYMENT_METHOD",
          failureMessage: "Payment method is invalid",
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "PROVIDER_ERROR":
        return {
          status: "FAILED",
          failureCode: "PROVIDER_ERROR",
          failureMessage: "Provider failed to process payment",
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "PROCESSING":
        return {
          status: "PROCESSING",
          providerPaymentId: `mock_pay_${randomUUID()}`,
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "TIMEOUT":
        return {
          status: "FAILED",
          failureCode: "PROVIDER_TIMEOUT",
          failureMessage: "Provider request timed out",
          response: { scenario: MOCK_PAYMENT_SCENARIO, timeout: true },
        };
      case "FAIL_TWICE_THEN_SUCCESS":
        if (input.attemptNumber <= 2)
          return {
            status: "FAILED",
            failureCode: "TEMPORARY_FAILURE",
            failureMessage: `Mock attempt ${input.attemptNumber} failed`,
            response: { scenario: MOCK_PAYMENT_SCENARIO },
          };
        return {
          status: "SUCCEEDED",
          providerPaymentId: `mock_pay_${randomUUID()}`,
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
      case "SUCCESS":
      default:
        return {
          status: "SUCCEEDED",
          providerPaymentId: `mock_pay_${randomUUID()}`,
          response: { scenario: MOCK_PAYMENT_SCENARIO },
        };
    }
  }

  async createRefund(input: {
    paymentId: number;
    refundId: number;
    amount: number;
    currency: string;
  }): Promise<RefundProviderResult> {
    switch (MOCK_REFUND_SCENARIO) {
      case "FAILED":
        return {
          status: "FAILED",
          failureCode: "REFUND_FAILED",
          failureMessage: "Mock provider failed the refund",
          response: { scenario: MOCK_REFUND_SCENARIO },
        };
      case "PROCESSING":
        return {
          status: "PROCESSING",
          providerRefundId: `mock_ref_${randomUUID()}`,
          response: { scenario: MOCK_REFUND_SCENARIO },
        };
      case "TIMEOUT":
        return {
          status: "FAILED",
          failureCode: "REFUND_PROVIDER_TIMEOUT",
          failureMessage: "Refund provider request timed out",
          response: { scenario: MOCK_REFUND_SCENARIO, timeout: true },
        };
      case "SUCCESS":
      default:
        return {
          status: "SUCCEEDED",
          providerRefundId: `mock_ref_${randomUUID()}`,
          response: { scenario: MOCK_REFUND_SCENARIO },
        };
    }
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
