import { z } from "zod";

export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MERCHANT_ADMIN",
  "MERCHANT_USER",
  "ANALYST",
  "SUPPORT",
]);

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters"),

  email: z
    .email("Invalid email address")
    .transform((email) => email.toLowerCase()),

  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters"),

  role: userRoleSchema.default("MERCHANT_USER"),
});

export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .transform((email) => email.toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type loginSchemaInput = z.infer<typeof loginSchema>;
