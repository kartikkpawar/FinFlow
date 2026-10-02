import { AppError, asyncHandler, STATUS_CODES } from "@finflow/shared";
import { secureSession } from "./secureSession";

const authProtectedRoutes = [
  { method: "POST", route: "/logout" },
  { method: "PATCH", route: "/reset-password" },
  { method: "GET", route: "/forgot-password" },
];

const IDENTITY_HEADERS = [
  "x-user-id",
  "x-user-role",
  "x-user-email",
  "x-gateway-secret",
] as const;

function stripIdentityHeaders(req: Parameters<typeof secureSession>[0]) {
  for (const header of IDENTITY_HEADERS) {
    delete req.headers[header];
  }
}

export const secureAuth = asyncHandler(async (req, res, next) => {
  stripIdentityHeaders(req);

  const gatewaySecret = process.env.API_GATEWAY_SECRET;
  if (!gatewaySecret) {
    throw new AppError(
      STATUS_CODES.CONFIG_ERROR,
      "GATEWAY_SECRET not configured",
    );
  }

  req.headers["x-gateway-secret"] = gatewaySecret;

  const isAuthRouteProtected = authProtectedRoutes.some(
    (authRoute) =>
      authRoute.route === req.path && authRoute.method === req.method,
  );

  if (isAuthRouteProtected) {
    return secureSession(req, res, next);
  }

  next();
});
