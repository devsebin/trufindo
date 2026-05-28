import { IPriorities } from "@/database/priority/priority-db-interface";
import { HydratedDocument } from "mongoose";
import { priorityErrorResponse } from "../../priority.response";
import { throwError } from "../../priority.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class findPriorityStateHelperService {
  async isAlreadyActive(
    status: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (status.is_active) {
        const data = priorityErrorResponse(status);
        throwError(
          "already_active",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "Priority is already active with title: {0} and id: {1}",
            data: { data },
            filler: { 0: status.label, 1: status._id },
          }),
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while checking active status", errorMap);
    }
  }

  async isAlreadyInactive(
    status: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (!status.is_active) {
        const data = priorityErrorResponse(status);

        throwError(
          "already_inactive",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "Priority is already inactive with title: {0} and id: {1}",
            data: { data },
            filler: { 0: status.label, 1: status._id },
          }),
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while checking inactive status", errorMap);
    }
  }

  async isAlreadyDeleted(
    status: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (status.is_deleted) {
        const data = priorityErrorResponse(status);

        throwError(
          "already_deleted",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "status is already deleted with title: {0} and id: {1}",
            data: { data },
            filler: { 0: status.label, 1: status._id },
          }),
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while checking deleted status", errorMap);
    }
  }

  async isNotDeleted(
    status: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (!status.is_deleted) {
        const data = priorityErrorResponse(status);

        throwError(
          "not_deleted",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "status is not deleted with title: {0} and id: {1}",
            data: { data },
            filler: { 0: status.label, 1: status._id },
          }),
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while checking deleted status", errorMap);
    }
  }

  async IsDefault(
    status: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (status.is_default) {
        const data = priorityErrorResponse(status);

        throwError(
          "default_priority",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message:
              "Default priority cannot be deleted / deactivated with title: {0} and id: {1}",
            data: { data },
            filler: { 0: status.label, 1: status._id },
          }),
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while checking default status", errorMap);
    }
  }
}

export default new findPriorityStateHelperService();
