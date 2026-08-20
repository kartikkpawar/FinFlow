export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperatinoalError: boolean;

  constructor(statusCode: number, message: string, isOperatinoalError = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperatinoalError = isOperatinoalError;
  }
}
