import type { MerchantStatus } from "../types/merchant";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateMerchantInput = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
};

export type UpdateMerchantInput = Partial<CreateMerchantInput>;

export type UpdateMerchantStatusInput = {
  status: MerchantStatus;
};

function requiredString(value: unknown, field: string, maxLength = 255): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }

  return normalized;
}

function email(value: unknown): string {
  const normalized = requiredString(value, "email");
  if (!EMAIL_REGEX.test(normalized)) {
    throw new Error("email must be valid");
  }
  return normalized.toLowerCase();
}

function phone(value: unknown): string {
  const normalized = requiredString(value, "phone", 15);
  if (!/^\+?[0-9]{7,15}$/.test(normalized)) {
    throw new Error("phone must contain 7-15 digits and may start with +");
  }
  return normalized;
}

export function validateCreateMerchant(body: unknown): CreateMerchantInput {
  if (!body || typeof body !== "object") throw new Error("request body is required");
  const input = body as Record<string, unknown>;
  return {
    name: requiredString(input.name, "name"),
    businessName: requiredString(input.businessName, "businessName"),
    email: email(input.email),
    phone: phone(input.phone),
  };
}

export function validateUpdateMerchant(body: unknown): UpdateMerchantInput {
  if (!body || typeof body !== "object") throw new Error("request body is required");
  const input = body as Record<string, unknown>;
  const output: UpdateMerchantInput = {};

  if (input.name !== undefined) output.name = requiredString(input.name, "name");
  if (input.businessName !== undefined) {
    output.businessName = requiredString(input.businessName, "businessName");
  }
  if (input.email !== undefined) output.email = email(input.email);
  if (input.phone !== undefined) output.phone = phone(input.phone);

  if (!Object.keys(output).length) throw new Error("at least one field is required");
  return output;
}

export function validateMerchantStatus(body: unknown): UpdateMerchantStatusInput {
  if (!body || typeof body !== "object") throw new Error("request body is required");
  const status = (body as Record<string, unknown>).status;
  const valid: MerchantStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "REJECTED"];
  if (typeof status !== "string" || !valid.includes(status as MerchantStatus)) {
    throw new Error(`status must be one of: ${valid.join(", ")}`);
  }
  return { status: status as MerchantStatus };
}

export function parseMerchantId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("merchantId must be a positive integer");
  return id;
}
