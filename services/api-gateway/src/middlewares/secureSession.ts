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

async function resolveMerchantRole(
  userId: number,
  merchantId: number,
  gatewaySecret: string,
) {
  const merchantsServiceUrl =
    process.env.MERCHANTS_SERVICE_URL || "http://localhost:3003";
  let response: globalThis.Response;

  try {
    response = await fetch(
      `${merchantsServiceUrl}/merchant-users/context?merchantId=${merchantId}`,
      {
        headers: {
          "x-user-id": String(userId),
          "x-gateway-secret": gatewaySecret,
        },
      },
    );
  } catch {
    throw new AppError(502, "Merchant service is unavailable");
  }

  if (!response.ok) {
    if (response.status === STATUS_CODES.FORBIDDEN) {
      throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant access denied");
    }
    throw new AppError(502, "Unable to resolve merchant access");
  }

  const body = (await response.json()) as {
    success?: boolean;
    data?: { merchantId?: number; role?: string };
  };

  if (!body.success || body.data?.merchantId !== merchantId || !body.data.role) {
    throw new AppError(502, "Invalid merchant membership response");
  }

  return body.data.role;
}

function getMerchantId(req: Request) {
  const rawMerchantId = req.headers["x-merchant-id"];
  if (Array.isArray(rawMerchantId)) return undefined;
  if (typeof rawMerchantId !== "string" || !rawMerchantId.trim()) return undefined;

  const merchantId = Number(rawMerchantId);
  if (!Number.isInteger(merchantId) || merchantId <= 0) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "Invalid merchant context");
  }
  return merchantId;
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
  const merchantId = getMerchantId(req);

  if (merchantId !== undefined) {
    const role = await resolveMerchantRole(
      jwtUser.userId,
      merchantId,
      gatewaySecret,
    );
    addIdentityHeaders(req, {
      ...jwtUser,
      role,
      gatewaySecret,
    });
  } else {
    addIdentityHeaders(req, { ...jwtUser, gatewaySecret });
  }

  next();
});
