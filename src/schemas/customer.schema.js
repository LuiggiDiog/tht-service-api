import Joi from "joi";

export const customerSchema = Joi.object({
  store_id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
});
