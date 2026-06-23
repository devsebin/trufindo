import { statusCodes } from "@/utils/definitions/constants/common";

export const providerErrorsMessages = {
  already_exists: {
    message: "Provider already exists with title: {0}",
    status: statusCodes.BadRequest,
  },
  provider_not_found: {
    message: "Provider not found with id: {0}",
    status: statusCodes.NotFound,
  },
};

export const providerSuccessMessages = {
  provider_created: {
    message: "Provider created successfully.",
    status: statusCodes.Created,
  },
};
