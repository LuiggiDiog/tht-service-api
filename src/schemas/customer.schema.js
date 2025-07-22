import Joi from "joi";

export const customerSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  company: Joi.string().allow("").optional(),
  rfc: Joi.string().allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

export const customerSchemaCreate = Joi.object({
  id: Joi.number().allow(null).optional(),
  name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  company: Joi.string().allow("").optional(),
  rfc: Joi.string().allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});
