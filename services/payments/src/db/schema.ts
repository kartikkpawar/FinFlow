import {
  bigint,
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

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", [
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export const paymentsTable = pgTable(
  "payments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id").notNull(),
    reference: varchar("reference", { length: 255 }).notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    description: text("description"),
    customerId: varchar("customer_id", { length: 255 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    succeededAt: timestamp("succeeded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    merchantReferenceIdx: uniqueIndex("payments_merchant_reference_idx").on(
      table.merchantId,
      table.reference,
    ),
    merchantStatusIdx: index("payments_merchant_status_idx").on(
      table.merchantId,
      table.status,
    ),
    merchantCreatedIdx: index("payments_merchant_created_idx").on(
      table.merchantId,
      table.createdAt,
    ),
    customerIdx: index("payments_customer_idx").on(
      table.merchantId,
      table.customerId,
    ),
  }),
);

export const paymentAttemptsTable = pgTable(
  "payment_attempts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => paymentsTable.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    provider: varchar("provider", { length: 100 }).notNull(),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    status: paymentAttemptStatusEnum("status").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    failureCode: varchar("failure_code", { length: 100 }),
    failureMessage: text("failure_message"),
    providerResponse:
      jsonb("provider_response").$type<Record<string, unknown>>(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    paymentAttemptUniqueIdx: uniqueIndex(
      "payment_attempts_payment_attempt_idx",
    ).on(table.paymentId, table.attemptNumber),
    paymentStatusIdx: index("payment_attempts_payment_status_idx").on(
      table.paymentId,
      table.status,
    ),
  }),
);

export const refundsTable = pgTable(
  "refunds",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => paymentsTable.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    reason: varchar("reason", { length: 500 }),
    status: refundStatusEnum("status").notNull().default("PENDING"),
    providerRefundId: varchar("provider_refund_id", { length: 255 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    paymentIdx: index("refunds_payment_idx").on(table.paymentId),
    statusIdx: index("refunds_status_idx").on(table.status),
  }),
);

export const paymentEventsTable = pgTable(
  "payment_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => paymentsTable.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    previousStatus: varchar("previous_status", { length: 30 }),
    newStatus: varchar("new_status", { length: 30 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    paymentCreatedIdx: index("payment_events_payment_created_idx").on(
      table.paymentId,
      table.createdAt,
    ),
  }),
);

export const idempotencyKeysTable = pgTable(
  "idempotency_keys",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    merchantId: integer("merchant_id").notNull(),
    key: varchar("key", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    response: jsonb("response").$type<Record<string, unknown>>().notNull(),
    statusCode: integer("status_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    merchantKeyUniqueIdx: uniqueIndex("idempotency_keys_merchant_key_idx").on(
      table.merchantId,
      table.key,
    ),
    expiresIdx: index("idempotency_keys_expires_idx").on(table.expiresAt),
  }),
);
