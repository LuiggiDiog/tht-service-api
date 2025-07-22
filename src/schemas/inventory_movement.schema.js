import Joi from "joi";

export const inventoryMovementSchema = Joi.object({
  store_id: Joi.number().required(),
  product_id: Joi.number().required(),
  change_qty: Joi.number().required(),
  reason: Joi.string().required(),
  occurred_at: Joi.date().optional(),
});
