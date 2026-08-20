import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const userRoleEnums = pgEnum("role", [
  "SUPER_ADMIN",
  "ADMIN",
  "MERCHANT_ADMIN",
  "MERCHANT_USER",
  "ANALYST",
  "SUPPORT",
]);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  email_verified: boolean("email_verified").default(true).notNull(),
  phone: varchar({ length: 15 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  account_locked: boolean("account_locked").default(true).notNull(),
  refresh_token: varchar("refresh_token", { length: 1024 }),
  login_attempts: integer("login_attempts").default(3).notNull(),
  role: userRoleEnums(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  modified_at: timestamp("modified_at").notNull().defaultNow(),
});
