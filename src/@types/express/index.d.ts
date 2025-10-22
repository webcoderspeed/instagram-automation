import { AuthenticatedUser } from "../../types/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      validatedData?: any;
      subscription?: {
        tier: string;
        limits: any;
      };
    }
  }
}

export {};

