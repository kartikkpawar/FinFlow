import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError";
import { STATUS_CODES } from "../statusCodes/respCodes";
import { responseMessage } from "../statusCodes/responseMessages";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      if (error instanceof AppError) {
        return next(error);
      }

      next(
        new AppError(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          error instanceof Error
            ? error.message
            : responseMessage.GENERAL.SOMETHING_WENT_WRONG,
        ),
      );
    });
  };
};
