import { AuthenticatedUser } from "../../types/user.types";
import { SubscriptionDocument } from "../../models/subscription.model";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      validatedData?: Record<string, unknown>;
      subscription?: SubscriptionDocument;
    }
  }
}

export {};

