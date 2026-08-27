import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import {
  AppError,
  asyncHandler,
  generateRefrehToken,
  hashRefreshToken,
  responseMessage,
  signJwt,
  STATUS_CODES,
  successResponse,
} from "@finflow/shared";
import { users, sessions } from "../db/schema.js";

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.REFRESH_TOKEN_INVALID,
      );
    }

    const refreshAccessTokenHash = hashRefreshToken(token);

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshAccessTokenHash))
      .limit(1);

    if (!session) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.REFRESH_TOKEN_INVALID,
      );
    }

    if (session?.revokedAt) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.SESSION_REVOKED,
      );
    }

    if (session?.expiresAt < new Date()) {
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        responseMessage.AUTH.SESSION_EXPIRED,
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.REFRESH_TOKEN_INVALID,
      );
    }

    const newRefreshToken = generateRefrehToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    await db
      .update(sessions)
      .set({
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt: new Date(),
      })
      .where(eq(sessions.id, session.id));

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const accessToken = signJwt({
      userId: user.id,
      purpose: "auth_login",
      role: user?.role,
      email: user.email,
    });
    return successResponse(res, {
      accessToken,
      tag: "ACCESS_TOKEN",
    });
  },
);
