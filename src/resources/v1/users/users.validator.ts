import Joi from "joi";
import { IInputUserPayloadStrict } from "./payloads/user-input.interface";
import { objectIdValidator } from "@/utils/responses/error.response";

export const userValidation = Joi.object<IInputUserPayloadStrict>({
  first_name: Joi.string().trim().optional().min(2).max(50).messages({
    "string.base": "First name must be a string",
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
    "string.empty": "First name cannot be empty",
  }),
  middle_name: Joi.string().trim().optional().min(2).max(50).messages({
    "string.base": "Middle name must be a string",
    "string.min": "Middle name must be at least 2 characters long",
    "string.max": "Middle name cannot exceed 50 characters",
    "string.empty": "Middle name cannot be empty",
  }),
  last_name: Joi.string().trim().optional().min(2).max(50).messages({
    "string.base": "Last name must be a string",
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
    "string.empty": "Last name cannot be empty",
  }),
  email: Joi.string().email().lowercase().trim().optional().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.empty": "Email cannot be empty",
  }),
  phone: Joi.string().trim().optional().min(10).max(15).messages({
    "string.base": "Phone number must be a string",
    "string.min": "Phone number must be at least 10 characters long",
    "string.max": "Phone number cannot exceed 15 characters",
  }),
  icon: Joi.string().trim().optional().custom(objectIdValidator).messages({
    "string.base": "Icon must be a string",
    "string.empty": "Icon cannot be empty",
    "any.custom": "Icon must be a valid MongoDB ObjectId",
  }),

  user_location: Joi.string().optional(),
  user_country: Joi.string().optional(),
  user_region: Joi.string().optional(),
  user_city: Joi.string().optional(),
  google_token: Joi.string().optional().trim().min(1).max(1000).messages({
    "string.base": "Google token must be a string",
    "string.empty": "Google token cannot be empty",
    "string.min": "Google token must be at least 1 character long",
    "string.max": "Google token cannot exceed 1000 characters",
  }),
  google_id: Joi.string().optional().trim().min(1).max(1000).messages({
    "string.base": "Google ID must be a string",
    "string.empty": "Google ID cannot be empty",
    "string.min": "Google ID must be at least 1 character long",
    "string.max": "Google ID cannot exceed 1000 characters",
  }),
  declaimer: Joi.array()
    .items(
      Joi.object({
        declaimer_id: Joi.string()
          .required()
          .trim()
          .min(1)
          .max(1000)
          .custom(objectIdValidator)
          .messages({
            "string.base": "Declaimer ID must be a string",
            "string.empty": "Declaimer ID cannot be empty",
            "string.min": "Declaimer ID must be at least 1 character long",
            "string.max": "Declaimer ID cannot exceed 1000 characters",
          }),
        accepted: Joi.boolean().required(),
      }),
    )
    .optional(),
  user_basic: Joi.object({
    first_name: Joi.string().trim().required(),
    last_name: Joi.string().trim().required(),
    business_name: Joi.string().trim().required(),
    year_of_experience: Joi.number().min(0).required(),
    street_address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    zip: Joi.string().trim().required(),
    gst_number: Joi.string().trim().required(),
    ird_number: Joi.string().trim().required(),
    declaimer: Joi.string().trim().required(),
  })
    .allow(null)
    .optional(),
})
  .or("email", "phone")
  .oxor("email", "phone");
