import { Request, Response, NextFunction } from "express";
import {
  AppError,
  STATUS_CODES,
  responseMessage,
  successResponse,
  signJwt,
  asyncHandler,
} from "@finflow/shared";
import { db } from "../db/index.js";
import { users, UserRole } from "../db/schema.js";
import { eq, or } from "drizzle-orm";
import { CreateUserInput } from "../schemas/index.js";
import bcryptjs from "bcryptjs";

export const registerUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone, name, password } = req.body as CreateUserInput;

    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.phone, phone)));

    if (user.length) {
      const respMessage = user[0]?.phone
        ? responseMessage.USER.PHONE_ALREADY_EXISTS
        : responseMessage.USER.EMAIL_ALREADY_EXISTS;

      next(new AppError(STATUS_CODES["CONFLICT"], respMessage));
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newUser = await db
      .insert(users)
      .values({
        email,
        phone,
        name,
        passwordHash,
      })
      .returning({ user_id: users.id, user_role: users.role });

    if (!newUser.length) {
      next(
        new AppError(
          STATUS_CODES["INTERNAL_SERVER_ERROR"],
          responseMessage.GENERAL.SOMETHING_WENT_WRONG,
        ),
      );
    }

    const userId = newUser[0]?.user_id as number;
    const role = newUser[0]?.user_role as string;

    const emailVerifyToken = await signJwt({
      email,
      userId,
      role: role as UserRole,
      purpose: "email_verification",
    });

    successResponse(
      res,
      {
        message: responseMessage.USER.USER_CREATED,
        email_verify: emailVerifyToken,
      },
      STATUS_CODES["CREATED"],
    );

    // TODO: Send Email to verify
  },
);
