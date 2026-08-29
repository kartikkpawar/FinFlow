import {
  AppError,
  asyncHandler,
  responseMessage,
  STATUS_CODES,
  UserPayload,
  verifyToken,
} from "@finflow/shared";
import { Request } from "express";

const IDENTITY_HEADERS = [
  "x-user-id",
  "x-user-role",
  "x-user-email",
  "x-gateway-secret",
] as const;

function stripIdentityHeaders(req: Request) {
  for (const header of IDENTITY_HEADERS) {
    delete req.headers[header];
  }
}

function getApiGatewaySecret(): string {
  const gatewaySecret = process.env.API_GATEWAY_SECRET;
  if (!gatewaySecret) {
    throw new AppError(
      STATUS_CODES.UNAUTHORIZED,
      responseMessage.GENERAL.GATEWAY_SECRET_INCORRECT,
    );
  }
  return gatewaySecret;
}

function addIdentityHeaders(
  req: Request,
  payload: UserPayload & { gatewaySecret: string },
) {
  req.headers["x-user-id"] = String(payload.userId);
  req.headers["x-user-role"] = payload.role;
  req.headers["x-user-email"] = payload.email;
  req.headers["x-gateway-secret"] = payload.gatewaySecret;
}

export const secureSession = asyncHandler(async (req, res, next) => {
  stripIdentityHeaders(req);
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(
      STATUS_CODES.UNAUTHORIZED,
      responseMessage.AUTH.INVALID_TOKEN,
    );
  }

  const token = authHeader.split(" ")[1];
  const jwtUser = verifyToken(token);
  const gatewaySecret = getApiGatewaySecret();
  addIdentityHeaders(req, { ...jwtUser, gatewaySecret });
  next();
});
