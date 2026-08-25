import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  successResponse,
  failedResponse,
  responseMessage,
  STATUS_CODES,
  signJwt,
  formatResponse,
  generateRefrehToken,
  hashRefreshToken,
  asyncHandler,
} from "@finflow/shared";

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const usersDetails = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!usersDetails.length) {
      return failedResponse(res, {
        message: responseMessage.AUTH.INVALID_CREDENTIALS,
        tag: "INVALID_CREDENTIALS",
      });
    }
    const user = usersDetails[0];

    if (!user?.emailVerified) {
      return failedResponse(
        res,
        {
          message: responseMessage.AUTH.EMAIL_NOT_VERIFIED,
          tag: "EMAIL_NOT_VERIFIED",
        },
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (user.accountLocked) {
      return successResponse(res, {
        message: responseMessage.AUTH.ACCOUNT_LOCKED,
        tag: "ACCOUNT_LOCKED",
      });
    }

    const validPassword = await bcryptjs.compare(password, user.passwordHash);
    if (!validPassword) {
      await db
        .update(users)
        .set({
          loginAttempts: user.loginAttempts - 1,
          accountLocked: user.loginAttempts - 1 === 0,
        })
        .where(eq(users.id, user.id));

      return failedResponse(res, {
        message: responseMessage.AUTH.INVALID_CREDENTIALS,
        tag: "INVALID_CREDENTIALS",
        attemptsPending: user.loginAttempts - 1,
      });
    }

    const accessToken = await signJwt({
      email,
      role: user.role,
      userId: user.id,
      purpose: "auth_login",
    });

    const refreshToken = generateRefrehToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await db.insert(sessions).values({ refreshTokenHash, userId: user.id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    successResponse(res, {
      message: responseMessage.AUTH.LOGIN_SUCCESS,
      tag: "LOGIN_SUCCESS",
      user: formatResponse(user, [
        "loginAttempts",
        "passwordHash",
        "accountLocked",
        "loginAttempts",
      ]),
      accessToken,
    });
  },
);
