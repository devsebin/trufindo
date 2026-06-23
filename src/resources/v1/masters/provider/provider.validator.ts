import Joi from "joi";
import { IProvider } from "@/database/provider/provider-db-interface";
import { objectIdValidator } from "@/utils/responses/error.response";

const phoneValidator = Joi.string().custom((value, helpers) => {
  console.log("Phone validator called with value:", value);

  const { countryCode } = helpers.state.ancestors[0];

  const result = validatePhoneNumber(value, countryCode);

  if (!result.isValid) {
    return helpers.error("any.invalid", {
      message: result.message,
    });
  }

  return value;
});

const testLogSchema = Joi.object({
  date: Joi.date().required(),
  result: Joi.string().valid("pass", "fail", "pending").required(),
  details: Joi.string().optional(),
});

const smsPayloadSchema = Joi.object({
  countryCode: Joi.string().trim().uppercase().required(),
  phone: phoneValidator.required(),
  message: Joi.string().required(),
});

const whatsappPayloadSchema = Joi.object({
  countryCode: Joi.string().trim().uppercase().required(),
  phone: phoneValidator.required(),
  templateId: Joi.string().required(),
  variables: Joi.object().required(),
});

const emailPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  subject: Joi.string().required(),
  body: Joi.string().required(),
});

const typeSchema = Joi.object({
  name: Joi.string().valid("SMS", "WHATSAPP", "EMAIL").required(),
  description: Joi.string().trim().required(),
  payloadSchema: Joi.when("name", {
    switch: [
      { is: "SMS", then: smsPayloadSchema },
      { is: "WHATSAPP", then: whatsappPayloadSchema },
      { is: "EMAIL", then: emailPayloadSchema },
    ],
    otherwise: Joi.forbidden(),
  }),
  test_log: Joi.array().items(testLogSchema).default([]),
});

export const countryProviderConfigValidationSchema = Joi.object({
  api_key: Joi.string().trim().optional(),
  api_secret: Joi.string().trim().min(8).optional(),
  endpoint_url: Joi.string().uri().optional(),
  timeout_ms: Joi.number().integer().min(1000).max(300000).default(30000),
  retry_attempts: Joi.number().integer().min(0).max(10).default(3),
  webhook_url: Joi.string().uri().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
  metadata: Joi.object().unknown(true).default({}),
});

export const supportedCountryInputValidationSchema = Joi.object({
  countryId: Joi.string().trim().custom(objectIdValidator).required(),
  config: countryProviderConfigValidationSchema.default({}),
  supportFrom: Joi.date().required(),
  supportUntil: Joi.date().greater(Joi.ref("supportFrom")).optional(),
});

export const providerInputValidationSchema = Joi.object<IProvider>({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().min(1).max(100).optional(),
});
