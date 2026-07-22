import { statusCodes } from "@/utils/definitions/constants/common";

export const authenticationSessionErrorMessages = {
  user_not_found: {
    message: "User created successfully. Please verify your email.",
    status: statusCodes.NotFound,
  },
  auth_session_not_created: {
    message: "Error while creating auth session.",
    status: statusCodes.InternalServerError,
  },
};

export const authenticationSessionSuccessMessages = {
  user_created: {
    message: "User created successfully. Please verify your email.",
    status: statusCodes.Created,
  },
  session_created: {
    message: "Session created successfully.",
    status: statusCodes.Created,
  },
  authentication_sessions_listed: {
    message: "Authentication sessions listed successfully.",
    status: statusCodes.OK,
  },
};
