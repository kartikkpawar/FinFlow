import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { and, eq, or } from "drizzle-orm";
import {
  AppError,
  asyncHandler,
  responseMessage,
  STATUS_CODES,
  successResponse,
  verifyToken,
} from "@finflow/shared";
import { users } from "../db/schema.js";

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token;

    if (!token) {
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        responseMessage.AUTH.INVALID_TOKEN,
      );
    }
    const verifiedToken = verifyToken(token as string);

    const { userId } = verifiedToken;

    const alreadyVerifiedUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.emailVerified, true)));

    if (alreadyVerifiedUser.length) {
      return successResponse(res, {
        message: responseMessage.AUTH.EMAIL_ALREADY_VERIFIED,
        tag: "EMAIL_ALREADY_VERIFIED",
      });
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
      })
      .where(and(eq(users.id, userId), eq(users.emailVerified, false)));

    successResponse(res, {
      message: responseMessage.AUTH.EMAIL_VERIFIED,
      tag: "EMAIL_VERIFIED",
    });
  },
);
