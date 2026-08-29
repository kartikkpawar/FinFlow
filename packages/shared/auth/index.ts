import { NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import crypto from "node:crypto";
import { AppError } from "../error/AppError";
import { STATUS_CODES } from "../statusCodes/respCodes";
import { responseMessage } from "../statusCodes/responseMessages";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MERCHANT_ADMIN"
  | "MERCHANT_USER"
  | "ANALYST"
  | "SUPPORT";

export type UserPayload = {
  userId: number;
  email: string;
  role: UserRole;
};

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT Secret is not setup");
  }
  return secret;
}

export async function signJwt(
  data: UserPayload & {
    purpose: "email_verification" | "auth_login" | "password_reset";
  },
) {
  const jwtSecret = getJWTSecret();

  const expiresIn = {
    email_verification: process.env.JWT_EXPIRES_IN_EMAIL_VERIFICATION,
    auth_login: process.env.JWT_EXPIRES_IN_LOGIN,
    password_reset: process.env.JWT_PASSWORD_RESET,
  };

  return jwt.sign(
    {
      userId: data.userId,
      email: data.email,
      role: data.role,
      purpose: data?.purpose,
    },
    jwtSecret,
    {
      expiresIn: expiresIn[data.purpose] as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyToken(token: string): UserPayload {
  try {
    const decodedToken = jwt.verify(token, getJWTSecret());
    if (typeof decodedToken !== "object" || decodedToken === null) {
      throw new Error("Invalid Token Payload");
    }

    return {
      userId: decodedToken.userId,
      role: decodedToken.role,
      email: decodedToken.email,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }

    throw error;
  }
}

export function generateRefrehToken() {
  return randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyGatewaySecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const expected = process.env.API_GATEWAY_SECRET;

  if (!expected) {
    return next(
      new AppError(STATUS_CODES.CONFIG_ERROR, "GATEWAY_SECRET not configured"),
    );
  }
  const incomingReq = req.header("x-gateway-secret");

  if (!incomingReq || incomingReq !== expected) {
    return next(
      new AppError(
        STATUS_CODES.FORBIDDEN,
        responseMessage.GENERAL.GATEWAY_SECRET_INCORRECT,
      ),
    );
  }
  next();
}

export function getIdentityHeaders(req: Request) {
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];

  if (!userId || !userRole) {
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      responseMessage.AUTH.INVALID_HEADERS,
    );
  }

  return { userId, userRole };
}
