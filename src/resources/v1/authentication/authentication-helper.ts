import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { CustomError, errorResponse } from "@/utils/responses/error.response";
import { successResponse } from "@/utils/responses/success.response";
import {
  authenticationErrors,
  authenticationSuccess,
} from "./authentication.messages";
import { ApiResponse } from "@/utils/responses/api.response";
import { IInputUser, IUser } from "@/database/users/users-db-interface";
import { priorities } from "@/utils/definitions/constants/priorities";
import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import mongoose from "mongoose";

export function returnAuthenticationError(
  type: keyof typeof authenticationErrors,
  data: any = [],
) {
  const { message, status } = authenticationErrors[type];
  return {
    result: errorResponse(message, status, data),
    DbTransaction: [],
  };
}

export function returnAuthenticationSuccess(
  type: keyof typeof authenticationSuccess,
  data: any = [],
  DbTransaction: DbTransaction[] = [],
) {
  const { message, status } = authenticationSuccess[type];
  return {
    result: successResponse(message, status, data),
    DbTransaction: DbTransaction,
  };
}

export function throwError<T = any>(
  message: keyof typeof authenticationErrors,
  data: ApiResponse<T>,
): never {
  const error = new Error() as CustomError;
  error.message = message;
  error.name = "ValidationError";
  error.data = data;
  throw error;
}

type CreateUserInput = Partial<IUser>;

export const buildUserObject = (
  overrides: CreateUserInput = {},
): IInputUser => {
  const defaults: IInputUser = {
    first_name: null,
    middle_name: null,
    last_name: null,
    role: "user",
    email: null,
    password: null,
    emailVerified: false,
    phone: null,
    phoneVerified: false,
    priority: {
      title: priorities.High,
      priority: 10,
    },
    user_location: "",
    user_country: "",
    user_region: "",
    user_city: "",

    referral_code: "",

    is_active: true,
    is_deleted: false,

    last_login: new Date(),
    login_attempts: 0,
    last_login_attempt: new Date(),

    is_account_locked: false,

    google_token: "",
    google_id: "",

    verification_attempts: 0,
    status: true,
  };

  return {
    ...defaults,
    ...overrides,
  };
};

export const buildAuthSessionObject = (
  overrides: Partial<IAuthSession> = {},
): IAuthSession => {
  const defaults: IAuthSession = {
    userId: new mongoose.Types.ObjectId(),
    refreshTokenHash: "",
    tokenId: "",
    deviceId: "",
    deviceName: "",
    device: {
      userAgent: "",
      browser: "",
      os: "",
      deviceType: "mobile",
    },
    ipAddress: "",
    location: {
      country: "",
      city: "",
    },
    isRevoked: false,
    createdAt: new Date(),
    expiresAt: new Date(),
  };

  return {
    ...defaults,
    ...overrides,
  };
};
