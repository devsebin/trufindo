import Joi from "joi";
import { IInputPriorityPayloadStrict } from "./payloads/priority-payload";

export const PriorityInputValidator = Joi.object<IInputPriorityPayloadStrict>({
  title: Joi.string().trim().min(1).max(100).required(),
  color: Joi.string().trim().min(1).max(100).required(),
});

export const deletePriorityQueryValidator = Joi.object({
  force_action: Joi.boolean().optional(),
});

export const updatePriorityQueryValidator = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  color: Joi.string().trim().min(1).max(100).required(),
});
