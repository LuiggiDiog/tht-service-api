import Joi from "joi";

export const storeSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  domain: Joi.string().uri().required(),
  config: Joi.object().required(),
});
