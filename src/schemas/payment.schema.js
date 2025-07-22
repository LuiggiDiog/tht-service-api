import Joi from "joi";

export const paymentSchema = Joi.object({
  order_id: Joi.number().required(),
  provider: Joi.string().default("transfer"),
  amount: Joi.number().min(0).required(),
  status: Joi.string()
    .valid("pending", "completed", "failed")
    .default("pending"),
  paid_at: Joi.date().optional(),
});
