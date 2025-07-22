import Joi from "joi";

export const orderSchema = Joi.object({
  store_id: Joi.number().required(),
  customer_id: Joi.number().required(),
  total_amount: Joi.number().min(0).required(),
  status: Joi.string()
    .valid("pending", "completed", "cancelled")
    .default("pending"),
});
