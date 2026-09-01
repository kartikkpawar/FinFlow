import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
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

export const merchantsTable = pgTable("merchants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: varchar("name", { length: 255 }).notNull(),

  businessName: varchar("business_name", {
    length: 255,
  }).notNull(),

  email: varchar("email", {
    length: 255,
  })
    .notNull()
    .unique(),

  phone: varchar("phone", {
    length: 15,
  })
    .notNull()
    .unique(),

  status: merchantStatusEnum("status").default("PENDING").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  modifiedAt: timestamp("modified_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const merchantUsersTable = pgTable("merchant_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  merchantId: integer("merchant_id")
    .notNull()
    .references(() => merchantsTable.id, {
      onDelete: "cascade",
    }),

  userId: integer("user_id").notNull(),

  role: merchantRoleEnum("role").default("MERCHANT_USER").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  modifiedAt: timestamp("modified_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export type Merchant = typeof merchantsTable.$inferSelect;
export type MerchantUser = typeof merchantUsersTable.$inferSelect;

export type NewMerchant = typeof merchantsTable.$inferInsert;
export type NewMerchantUser = typeof merchantUsersTable.$inferInsert;
