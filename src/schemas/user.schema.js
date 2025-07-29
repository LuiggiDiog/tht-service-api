import Joi from "joi";

export const userSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().required(),
  status: Joi.string().valid("active", "inactive").optional(),
  branch: Joi.string().required(),
});

export const userSchemaCreate = Joi.object({
  id: Joi.number().allow(null).optional(),
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().required(),
  status: Joi.string().valid("active", "inactive").optional(),
  branch: Joi.string().required(),
});
