import Joi from "joi";

export const categorySchema = Joi.object({
  store_id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
  parent_id: Joi.number().optional().allow(null),
});
