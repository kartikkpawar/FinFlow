import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const merchantStatusEnum = pgEnum("merchant_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "REJECTED",
]);
export const merchantRoleEnum = pgEnum("merchant_role", [
  "MERCHANT_ADMIN",
  "MERCHANT_USER",
]);
export const merchantUserStatusEnum = pgEnum("merchant_user_status", [
  "ACTIVE",
  "INACTIVE",
]);
export const invitationStatusEnum = pgEnum("merchant_invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);
export const webhookDeliveryStatusEnum = pgEnum(
  "merchant_webhook_delivery_status",
  ["PENDING", "DELIVERED", "FAILED"],
);

export const merchantsTable = pgTable("merchants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  status: merchantStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  modifiedAt: timestamp("modified_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const merchantUsersTable = pgTable(
  "merchant_users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull(),
    role: merchantRoleEnum("role").default("MERCHANT_USER").notNull(),
    status: merchantUserStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    modifiedAt: timestamp("modified_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    merchantUserUnique: uniqueIndex("merchant_users_merchant_user_unique").on(
      table.merchantId,
      table.userId,
    ),
    userIndex: index("merchant_users_user_id_idx").on(table.userId),
  }),
);

export const merchantSettingsTable = pgTable("merchant_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  merchantId: integer("merchant_id")
    .notNull()
    .unique()
    .references(() => merchantsTable.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  notificationsEnabled: boolean("notifications_enabled")
    .default(true)
    .notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  modifiedAt: timestamp("modified_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const merchantInvitationsTable = pgTable(
  "merchant_invitations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: merchantRoleEnum("role").default("MERCHANT_USER").notNull(),
    status: invitationStatusEnum("status").default("PENDING").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    invitedBy: integer("invited_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    merchantEmailIndex: index("merchant_invitations_merchant_email_idx").on(
      table.merchantId,
      table.email,
    ),
  }),
);

export const merchantApiKeysTable = pgTable(
  "merchant_api_keys",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    prefix: varchar("prefix", { length: 24 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
    createdBy: integer("created_by").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    merchantIndex: index("merchant_api_keys_merchant_idx").on(table.merchantId),
  }),
);

export const merchantWebhooksTable = pgTable(
  "merchant_webhooks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 2048 }).notNull(),
    secretPrefix: varchar("secret_prefix", { length: 24 }).notNull(),
    secretHash: varchar("secret_hash", { length: 64 }).notNull(),
    events: jsonb("events").$type<string[]>().default([]).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    modifiedAt: timestamp("modified_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    merchantIndex: index("merchant_webhooks_merchant_idx").on(table.merchantId),
  }),
);

export const merchantWebhookDeliveriesTable = pgTable(
  "merchant_webhook_deliveries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    webhookId: integer("webhook_id")
      .notNull()
      .references(() => merchantWebhooksTable.id, { onDelete: "cascade" }),
    event: varchar("event", { length: 100 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: webhookDeliveryStatusEnum("status").default("PENDING").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastStatusCode: integer("last_status_code"),
    lastError: text("last_error"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pendingIndex: index("merchant_webhook_deliveries_pending_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    merchantIndex: index("merchant_webhook_deliveries_merchant_idx").on(
      table.merchantId,
      table.createdAt,
    ),
  }),
);

export const merchantAuditLogsTable = pgTable(
  "merchant_audit_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    actorUserId: integer("actor_user_id").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: varchar("resource_id", { length: 100 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    merchantCreatedIndex: index("merchant_audit_logs_merchant_created_idx").on(
      table.merchantId,
      table.createdAt,
    ),
  }),
);

export type Merchant = typeof merchantsTable.$inferSelect;
export type MerchantUser = typeof merchantUsersTable.$inferSelect;
export type NewMerchant = typeof merchantsTable.$inferInsert;
export type NewMerchantUser = typeof merchantUsersTable.$inferInsert;
