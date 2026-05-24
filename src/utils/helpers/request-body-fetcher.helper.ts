import { throwError } from "@/resources/v1/masters/status/status.helper";
import { ErrorTypes, ResponseBuilder } from "./response-builder";
import { Request } from "express";

export function getRequestBody<TPayload, TDto>(
  request: Request,
  payload: TPayload | undefined,
  mapper: (payload: TPayload) => TDto,
): TDto {
  const body = payload ?? (request.body as TPayload);

  if (!body) {
    const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
      message: "Request body is required.",
    });

    throwError("invalid_request", response);
  }

  return mapper(body);
}
