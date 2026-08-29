import type { Request } from "express";
import { getIdentityHeaders } from ".";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MERCHANT_ADMIN: "MERCHANT_ADMIN",
  MERCHANT_USER: "MERCHANT_USER",
  ANALYST: "ANALYST",
  SUPPORT: "SUPPORT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Merchant
  MERCHANT_READ: "merchant:read",
  MERCHANT_WRITE: "merchant:write",
  MERCHANT_UPDATE: "merchant:update",
  MERCHANT_DELETE: "merchant:delete",

  // Customer
  CUSTOMER_READ: "customer:read",
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_UPDATE: "customer:update",
  CUSTOMER_DELETE: "customer:delete",

  // Payment
  PAYMENT_READ: "payment:read",
  PAYMENT_CREATE: "payment:create",
  PAYMENT_UPDATE: "payment:update",

  // Refund
  REFUND_READ: "refund:read",
  REFUND_CREATE: "refund:create",
  REFUND_MANAGE: "refund:manage",

  // Fraud
  FRAUD_READ: "fraud:read",
  FRAUD_REVIEW: "fraud:review",
  FRAUD_MANAGE: "fraud:manage",

  // Webhook
  WEBHOOK_READ: "webhook:read",
  WEBHOOK_CREATE: "webhook:create",
  WEBHOOK_UPDATE: "webhook:update",
  WEBHOOK_DELETE: "webhook:delete",

  // API Keys
  API_KEY_READ: "api_key:read",
  API_KEY_CREATE: "api_key:create",
  API_KEY_REVOKE: "api_key:revoke",

  // Users
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Analytics
  ANALYTICS_READ: "analytics:read",

  // Reports
  REPORT_READ: "report:read",
  REPORT_EXPORT: "report:export",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Audit
  AUDIT_READ: "audit:read",

  // System
  SYSTEM_READ: "system:read",
  SYSTEM_MANAGE: "system:manage",

  // DLQ
  DLQ_READ: "dlq:read",
  DLQ_REPLAY: "dlq:replay",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  SUPER_ADMIN: ["*"],

  ADMIN: [
    PERMISSIONS.MERCHANT_READ,
    PERMISSIONS.MERCHANT_UPDATE,

    PERMISSIONS.PAYMENT_READ,

    PERMISSIONS.REFUND_MANAGE,

    PERMISSIONS.FRAUD_MANAGE,

    PERMISSIONS.ANALYTICS_READ,

    PERMISSIONS.USER_READ,

    PERMISSIONS.USER_UPDATE,

    PERMISSIONS.AUDIT_READ,

    PERMISSIONS.SYSTEM_READ,

    PERMISSIONS.DLQ_READ,
    PERMISSIONS.DLQ_REPLAY,
  ],

  SUPPORT: [
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.REFUND_READ,
    PERMISSIONS.FRAUD_READ,
    PERMISSIONS.MERCHANT_READ,
  ],

  ANALYST: [
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.CUSTOMER_READ,

    PERMISSIONS.FRAUD_READ,
    PERMISSIONS.FRAUD_REVIEW,

    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
  ],

  MERCHANT_ADMIN: [
    PERMISSIONS.MERCHANT_READ,
    PERMISSIONS.MERCHANT_UPDATE,

    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,

    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_UPDATE,

    PERMISSIONS.REFUND_READ,
    PERMISSIONS.REFUND_CREATE,

    PERMISSIONS.WEBHOOK_READ,
    PERMISSIONS.WEBHOOK_CREATE,
    PERMISSIONS.WEBHOOK_UPDATE,
    PERMISSIONS.WEBHOOK_DELETE,

    PERMISSIONS.API_KEY_READ,
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_REVOKE,

    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,

    PERMISSIONS.ANALYTICS_READ,

    PERMISSIONS.FRAUD_READ,

    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],

  MERCHANT_USER: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_CREATE,

    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,

    PERMISSIONS.REFUND_READ,

    PERMISSIONS.ANALYTICS_READ,

    PERMISSIONS.FRAUD_READ,
  ],
};

type RolePermission = Permission | "*";

export const hasPermission = (
  req: Request,
  requiredPermission: RolePermission,
): boolean => {
  const { role } = getIdentityHeaders(req);
  const permissions = ROLE_PERMISSIONS[role as Role];

  if (!permissions) {
    return false;
  }

  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(requiredPermission);
};
