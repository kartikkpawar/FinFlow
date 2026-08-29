import { asyncHandler } from "@finflow/shared";
import { secureSession } from "./secureSession";

const authProtectedRoutes = [
  { method: "POST", route: "/logout" },
  { method: "PATCH", route: "/reset-password" },
  { method: "PATCH", route: "/forgot-password" },
];

export const secureAuth = asyncHandler(async (req, res, next) => {
  const reqPath = req.path;
  const reqMethod = req.method;

  const isAuthRouteProctected = authProtectedRoutes.find(
    (authRoute) =>
      authRoute.route === reqPath && authRoute.method === reqMethod,
  );

  if (isAuthRouteProctected) {
    return secureSession(req, res, next);
  }
  next();
});
