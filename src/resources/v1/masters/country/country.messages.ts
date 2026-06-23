import { statusCodes } from "@/utils/definitions/constants/common";

export const countryErrorsMessages = {
  already_exists: {
    message: "Country already exists with title: {0}",
    status: statusCodes.BadRequest,
  },
  country_not_found: {
    message: "Country not found with id: {0}",
    status: statusCodes.NotFound,
  },
};

export const countrySuccessMessages = {
  country_created: {
    message: "Country created successfully.",
    status: statusCodes.Created,
  },
};
