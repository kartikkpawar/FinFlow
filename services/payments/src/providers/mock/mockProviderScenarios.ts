export type MockPaymentScenario =
  | "SUCCESS"
  | "PENDING"
  | "INSUFFICIENT_FUNDS"
  | "CARD_DECLINED"
  | "INVALID_PAYMENT_METHOD"
  | "PROVIDER_ERROR"
  | "PROCESSING"
  | "TIMEOUT"
  | "FAIL_TWICE_THEN_SUCCESS";

export type MockRefundScenario = "SUCCESS" | "FAILED" | "PROCESSING" | "TIMEOUT";

export const MOCK_PAYMENT_SCENARIO = (process.env.MOCK_PAYMENT_SCENARIO ?? "SUCCESS") as MockPaymentScenario;
export const MOCK_REFUND_SCENARIO = (process.env.MOCK_REFUND_SCENARIO ?? "SUCCESS") as MockRefundScenario;
