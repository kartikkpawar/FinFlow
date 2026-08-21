import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/AppError";

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(new AppError(400, errorMessage));
    }

    req.body = result.data;
    next();
  };
}
