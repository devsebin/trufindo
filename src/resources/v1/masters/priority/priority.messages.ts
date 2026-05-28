import { statusCodes } from "@/utils/definitions/constants/common";

export const priorityErrorsMessages = {
  already_exists: {
    message: "Priority already exists with title: {0}",
    status: statusCodes.Conflict,
  },
  priority_not_found: {
    message: "Priority not found with id: {0}",
    status: statusCodes.NotFound,
  },
  already_active: {
    message: "Priority is already active with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  already_inactive: {
    message: "Priority is already inactive with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  already_deleted: {
    message: "Priority is already deleted with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  not_deleted: {
    message: "Priority is not deleted with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  default_priority: {
    message:
      "Default priority cannot be deleted / deactivated with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  default_priority_exists: {
    message: "Default priority already exists with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  no_default_priority_found: {
    message: "Default priority not found",
    status: statusCodes.BadRequest,
  },
  confirmation_required: {
    message: "Priority is not deleted with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
  no_change_detected: {
    message: "No change detected for priority with title: {0} and id: {1}",
    status: statusCodes.BadRequest,
  },
};

export const prioritySuccessMessages = {
  priority_created: {
    message: "Priority created successfully.",
    status: statusCodes.Created,
  },
  priority_deleted: {
    message: "Priority deleted successfully.",
    status: statusCodes.OK,
  },
  priority_deactivated: {
    message: "Priority deactivated successfully.",
    status: statusCodes.OK,
  },
  priority_activated: {
    message: "Priority activated successfully.",
    status: statusCodes.OK,
  },
  priority_fetched: {
    message: "Priority details fetched successfully.",
    status: statusCodes.OK,
  },
  priority_updated: {
    message: "Priority updated successfully.",
    status: statusCodes.OK,
  },
  default_priority_set: {
    message: "Default priority set successfully.",
    status: statusCodes.OK,
  },
};
