import Joi from "joi";

export const productSchema = Joi.object({
  store_id: Joi.number().required(),
  sku: Joi.string().optional(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  image_url: Joi.string().uri().optional(),
  cost: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().min(0).required(),
  metadata: Joi.object().default({}).optional(),
});
