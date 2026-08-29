import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { and, eq, or } from "drizzle-orm";
import {
  AppError,
  asyncHandler,
  getIdentityHeaders,
  hashRefreshToken,
  responseMessage,
  STATUS_CODES,
  successResponse,
  verifyToken,
} from "@finflow/shared";
import { sessions } from "../db/schema.js";

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const logoutAll = req.query.type === "all";
    const { userId } = getIdentityHeaders(req);

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.UNAUTHORIZED,
      );
    }
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash));

    if (!session) {
      throw new AppError(
        STATUS_CODES.UNAUTHORIZED,
        responseMessage.AUTH.UNAUTHORIZED,
      );
    }

    if (session?.revokedAt) {
      return successResponse(res, {
        message: responseMessage.AUTH.LOGOUT_SUCCESS,
        tag: "LOGOUT_SUCCESS",
      });
    }

    let where = and(
      eq(sessions.refreshTokenHash, refreshTokenHash),
      eq(sessions.id, session.id),
    );

    if (logoutAll) {
      await db
        .update(sessions)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(sessions.userId, userId));
    } else {
      await db
        .update(sessions)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(sessions.id, session.id));
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    successResponse(res, {
      message: responseMessage.AUTH.LOGOUT_SUCCESS,
      tag: "LOGOUT_SUCCESS",
    });
  },
);
