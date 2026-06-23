import ICountry from "@/database/country/country-db-interface";
import { objectIdValidator } from "@/utils/responses/error.response";
import Joi from "joi";

export const countryInputValidator = Joi.object<ICountry>({
  name: Joi.string().trim().min(3).max(255).uppercase().required(),
  iso_code: Joi.string().length(2).uppercase().required(), // ISO 3166-1 alpha-2
  iso_code_3: Joi.string().length(3).uppercase().required(), // ISO 3166-1 alpha-3
  phone_code: Joi.string().allow(null, ""), // Optional string
  currency: Joi.string().allow(null, "").uppercase(), // Optional string
  continent: Joi.string().allow(null, ""), // Optional string
  region_ids: Joi.array().items(Joi.string()).allow(null),
  timezone: Joi.array().items(Joi.string()).allow(null),
  flags: Joi.string().optional().custom(objectIdValidator),
});
