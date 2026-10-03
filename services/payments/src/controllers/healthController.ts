import type { Request, Response } from "express";
import { successResponse } from "@finflow/shared";

export function healthController(_req: Request, res: Response) {
  return successResponse(res, { service: "payments-service" });
}
