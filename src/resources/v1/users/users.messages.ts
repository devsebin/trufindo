import { statusCodes } from "@/utils/definitions/constants/common";

export const userSuccessMessages = {
  user_created: {
    message: "User created successfully.",
    status: statusCodes.Created,
  },
  user_updated: {
    message: "User updated successfully.",
    status: statusCodes.OK,
  },
  user_deleted: {
    message: "User deleted successfully.",
    status: statusCodes.OK,
  },
  user_fetched: {
    message: "User fetched successfully.",
    status: statusCodes.OK,
  },
};

export const userErrorMessages = {
  invalid_id: {
    message: "Invalid user id: {0}",
    status: statusCodes.BadRequest,
  },
  user_id_required: {
    message: "User id is required",
    status: statusCodes.BadRequest,
  },
  user_not_found: {
    message: "User not found with id: {0}",
    status: statusCodes.NotFound,
  },
  user_already_exists: {
    message: "User already exists with email: {0}",
    status: statusCodes.Conflict,
  },
  user_not_updated: {
    message: "Error while updating user",
    status: statusCodes.InternalServerError,
  },
  email_already_exists: {
    message: "User already exists with email: {0}",
    status: statusCodes.Conflict,
  },
  phone_already_exists: {
    message: "User already exists with phone: {0}",
    status: statusCodes.Conflict,
  },
  user_not_created: {
    message: "Error while creating user",
    status: statusCodes.InternalServerError,
  },
};
