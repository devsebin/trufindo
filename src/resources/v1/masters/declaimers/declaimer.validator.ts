import Joi from "joi";
import mongoose from "mongoose";

export enum declaimerKeys {
  TERMS_OF_SERVICE = "terms_of_service",
  PRIVACY_POLICY = "privacy_policy",
  ABOUT_US = "about_us",
  CONTACT_US = "contact_us",
  FAQ = "faq",
  DISCLAIMER = "disclaimer",
}

/* ------------------ ObjectId Validator ------------------ */
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("Invalid ObjectId");
  }
  return value;
}, "ObjectId validation");

/* ------------------ Create Declaimer ------------------ */
export const createDeclaimerValidation = Joi.object({
  key: Joi.string()
    .trim()
    .lowercase()
    .required()
    .valid(...Object.values(declaimerKeys))
    .messages({
      "any.required": "Key is required",
    }),
  title: Joi.string().trim().required(),
  content: Joi.string().trim().required(),
  language: Joi.string().length(2).lowercase().default("en"),
  country: Joi.string().length(2).uppercase().allow(null).required(),
  metadata: Joi.object().optional(),

  published_at: Joi.forbidden(),
  created_by: Joi.forbidden(),
  version: Joi.forbidden(),
  created_at: Joi.forbidden(),
  updated_at: Joi.forbidden(),
  deleted_at: Joi.date().forbidden(),
  is_deleted: Joi.boolean().forbidden().default(false),
  updated_by: Joi.string().forbidden(),
  deleted_by: Joi.string().forbidden(),
  status_id: Joi.forbidden(), // Set internally, not by user
  is_active: Joi.boolean().forbidden().default(true),
});

/* ------------------ Update Declaimer ------------------ */
export const updateDeclaimerValidation = Joi.object({
  title: Joi.string().trim().optional(),
  content: Joi.string().trim().optional(),
  metadata: Joi.object().optional(),

  language: Joi.forbidden(),
  country: Joi.forbidden(),
  published_at: Joi.forbidden(),
  created_by: Joi.forbidden(),
  version: Joi.forbidden(),
  created_at: Joi.forbidden(),
  updated_at: Joi.forbidden(),
  deleted_at: Joi.date().forbidden(),
  is_deleted: Joi.boolean().forbidden().default(false),
  updated_by: Joi.string().forbidden(),
  deleted_by: Joi.string().forbidden(),
  status_id: Joi.forbidden(), // Set internally, not by user
  is_active: Joi.boolean().forbidden().default(true),
});
