import Joi from "joi";

export const productCategorySchema = Joi.object({
  product_id: Joi.number().required(),
  category_id: Joi.number().required(),
});
