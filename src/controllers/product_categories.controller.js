import Joi from "joi";

const productCategorySchema = Joi.object({
  product_id: Joi.number().required(),
  category_id: Joi.number().required(),
});

export const getProductCategories = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM product_categories WHERE product_id = $1`,
    [req.params.product_id]
  );
  return res.resp(rows);
};

export const addProductCategory = async (req, res) => {
  const { error } = productCategorySchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { product_id, category_id } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) RETURNING *`,
    [product_id, category_id]
  );
  return res.resp(rows[0]);
};

export const removeProductCategory = async (req, res) => {
  const { product_id, category_id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM product_categories WHERE product_id = $1 AND category_id = $2 RETURNING *`,
    [product_id, category_id]
  );
  return res.resp(rows[0]);
};
