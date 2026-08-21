export const responseMessage = {
  AUTH: {
    INVALID_CREDENTIALS: "Invalid email or password",
    INVALID_TOKEN: "Invalid authentication token",
    TOKEN_EXPIRED: "Authentication token has expired",
    REFRESH_TOKEN_EXPIRED: "Refresh token has expired",
    REFRESH_TOKEN_INVALID: "Invalid refresh token",
    UNAUTHORIZED: "Authentication required",
    ACCOUNT_LOCKED: "Account is locked",
    ACCOUNT_DISABLED: "Account is disabled",
    ACCOUNT_NOT_VERIFIED: "Account is not verified",
    SESSION_EXPIRED: "Session has expired",
    PASSWORD_INCORRECT: "Incorrect password",
    PASSWORD_EXPIRED: "Password has expired",
    PASSWORD_ALREADY_USED: "Password has already been used",
    PASSWORD_RESET_TOKEN_INVALID: "Invalid or expired password reset token",
    EMAIL_VERIFIED: "Email verified successfully",
    EMAIL_ALREADY_VERIFIED: "Email already verified. Please login to continue",
  },

  USER: {
    NOT_FOUND: "User not found",
    ALREADY_EXISTS: "User already exists",
    EMAIL_ALREADY_EXISTS: "Email is already registered",
    PHONE_ALREADY_EXISTS: "Phone number is already registered",
    INVALID_EMAIL: "Invalid email address",
    INVALID_PHONE: "Invalid phone number",
    PROFILE_NOT_FOUND: "User profile not found",
    USER_SUSPENDED: "User account is suspended",
    USER_DELETED: "User account has been deleted",
    USER_CREATED: "User created successfully",
  },

  PERMISSION: {
    ACCESS_DENIED: "Access denied",
    INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
    ROLE_NOT_FOUND: "Role not found",
    PERMISSION_NOT_FOUND: "Permission not found",
  },
  GENERAL: {
    SOMETHING_WENT_WRONG:
      "Something went wrong, Please contact your administrator",
  },
};
