import Joi from "joi";

export const userSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password_hash: Joi.string().required(),
  role: Joi.string()
    .valid("super_admin", "admin", "manager", "support")
    .required(),
});

// Actualizar esquema para reflejar la nueva relación
export const assignStoresSchema = Joi.object({
  userId: Joi.number().required(),
  storeIds: Joi.array().items(Joi.number()).min(1).required(),
});
