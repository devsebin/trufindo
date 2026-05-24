import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export function paramsValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const invalidParams: string[] = [];

  // Collect all invalid param values
  for (const [key, value] of Object.entries(req.params)) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      invalidParams.push(`${key} -> ${value} is not a valid ObjectId.`);
    }
  }

  // If any invalid parameters exist, return once here
  if (invalidParams.length > 0) {
    return res
      .status(statusCodes.BadRequest)
      .json(
        errorResponse(
          errorMessages.InvalidID,
          statusCodes.BadRequest,
          invalidParams,
        ),
      );
  }

  next(); // All params valid
}
