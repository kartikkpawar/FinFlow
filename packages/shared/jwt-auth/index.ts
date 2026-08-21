import jwt from "jsonwebtoken";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MERCHANT_ADMIN"
  | "MERCHANT_USER"
  | "ANALYST"
  | "SUPPORT";

type UserPayload = {
  userId: number;
  email: string;
  role: UserRole;
};

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT Secret is not setup");
  }
  return secret;
}

export async function signJwt(
  data: UserPayload & {
    purpose: "email_verification" | "auth_login" | "auth_refresh";
  },
) {
  const jwtSecret = getJWTSecret();

  const expiresIn = {
    email_verification: process.env.JWT_EXPIRES_IN_EMAIL_VERIFICATION,
    auth_login: process.env.JWT_EXPIRES_IN_LOGIN,
    auth_refresh: process.env.JWT_EXPIRES_IN_REFRESH_TOKEN,
  };

  return jwt.sign(
    {
      userId: data.userId,
      email: data.email,
      role: data.role,
      purpose: data?.purpose,
    },
    jwtSecret,
    {
      expiresIn: expiresIn[data.purpose] as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyToken(token: string): UserPayload {
  const decodedToken = jwt.verify(token, getJWTSecret());
  if (typeof decodedToken !== "object" || decodedToken === null) {
    throw new Error("Invalid Token Payload");
  }

  return {
    userId: decodedToken.userId,
    role: decodedToken.role,
    email: decodedToken.email,
  };
}
