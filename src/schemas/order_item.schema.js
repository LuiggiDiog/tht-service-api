import Joi from "joi";

export const orderItemSchema = Joi.object({
  order_id: Joi.number().required(),
  product_id: Joi.number().required(),
  quantity: Joi.number().min(1).required(),
  unit_price: Joi.number().min(0).required(),
});
