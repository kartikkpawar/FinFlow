import {
  AppError,
  asyncHandler,
  responseMessage,
  signJwt,
  STATUS_CODES,
  successResponse,
  verifyToken,
} from "@finflow/shared";
import { UserRole, users } from "../db/schema";
import bcryptjs from "bcryptjs";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const sendForgotPasswordEmail = asyncHandler(async (req, res, next) => {
  if (!Object.keys(req?.user || {}).length || !req?.user || !req.user.userId) {
    throw new AppError(
      STATUS_CODES.UNAUTHORIZED,
      responseMessage.AUTH.INVALID_TOKEN,
    );
  }

  const { role, email, userId } = req.user;

  const passwordResetToken = await signJwt({
    email,
    userId,
    role: role as UserRole,
    purpose: "password_reset",
  });

  successResponse(res, {
    password_reset_token: passwordResetToken,
    message: responseMessage.GENERAL.EMAIL_SENT,
    tag: "EMAIL_SENT",
  });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      responseMessage.AUTH.INVALID_TOKEN,
    );
  }
  const verifiedToken = verifyToken(token as string);

  const { userId } = verifiedToken;
  const { newPassword } = req.body;

  const passwordHash = await bcryptjs.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash,
    })
    .where(eq(users.id, userId));

  successResponse(res, {
    message: responseMessage.AUTH.PASSWORD_CHANGED,
    tag: "PASSWORD_CHANGED",
  });
});
