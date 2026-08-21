import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "ADMIN",
  "MERCHANT_ADMIN",
  "MERCHANT_USER",
  "ANALYST",
  "SUPPORT",
]);

export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  accountLocked: boolean("account_locked").default(false).notNull(),
  loginAttempts: integer("login_attempts").default(3).notNull(),
  role: userRoleEnum("role").default("MERCHANT_USER").notNull(),

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

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),

  refreshTokenHash: varchar("refresh_token_hash", {
    length: 255,
  }).notNull(),

  expiresAt: timestamp("expires_at", {
    withTimezone: true,
  })
    .default(sql`NOW() + INTERVAL '7 days'`)
    .notNull(),

  revokedAt: timestamp("revoked_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  lastUsedAt: timestamp("last_used_at", {
    withTimezone: true,
  }),
});
