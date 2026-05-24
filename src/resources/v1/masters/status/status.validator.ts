import Joi from "joi";
import { IInputStatusPayloadStrict } from "./payloads/create-status.payload";

export const statusInputValidator = Joi.object<IInputStatusPayloadStrict>({
  title: Joi.string().trim().min(1).max(100).required(),
  color: Joi.string().trim().min(1).max(100).required(),
});
