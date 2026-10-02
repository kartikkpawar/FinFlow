export const MERCHANT_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "REJECTED",
] as const;

export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

export type Identity = {
  userId: number;
  role: string;
  email: string;
};
