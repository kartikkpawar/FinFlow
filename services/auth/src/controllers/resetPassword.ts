import {
  AppError,
  asyncHandler,
  responseMessage,
  STATUS_CODES,
  successResponse,
} from "@finflow/shared";

import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export const resetPassword = asyncHandler(async (req, res, next) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(
      STATUS_CODES.UNAUTHORIZED,
      responseMessage.AUTH.INVALID_TOKEN,
    );
  }

  const [user] = await db
    .select({ currentPassword: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new AppError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      responseMessage.GENERAL.SOMETHING_WENT_WRONG,
    );
  }

  const { currentPassword, newPassword } = req.body;

  const isCurrentPassValid = bcryptjs.compare(
    currentPassword,
    user.currentPassword,
  );

  if (!isCurrentPassValid) {
    throw new AppError(
      STATUS_CODES.VALIDATION_ERROR,
      responseMessage.AUTH.INVALID_CREDENTIALS,
    );
  }

  const newPasswordHash = await bcryptjs.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
    })
    .where(eq(users.id, userId));

  successResponse(res, {
    message: responseMessage.AUTH.PASSWORD_CHANGED,
    tag: "PASSWORD_CHANGED",
  });
});
