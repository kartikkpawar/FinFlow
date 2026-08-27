import { UserPayload } from "@finflow/shared";

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
