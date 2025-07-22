import Joi from "joi";

const categorySchema = Joi.object({
  store_id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
  parent_id: Joi.number().optional().allow(null),
});

export const getCategories = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM categories WHERE store_id = $1`,
    [req.store_id]
  );
  return res.resp(rows);
};

export const getCategory = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM categories WHERE id = $1 AND store_id = $2`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};

export const createCategory = async (req, res) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { store_id, name, parent_id } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO categories (store_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
    [store_id, name, parent_id]
  );
  return res.resp(rows[0]);
};

export const updateCategory = async (req, res) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { id } = req.params;
  const { store_id, name, parent_id } = req.body;
  const { rows } = await req.exec(
    `UPDATE categories SET store_id = $1, name = $2, parent_id = $3 WHERE id = $4 RETURNING *`,
    [store_id, name, parent_id, id]
  );
  return res.resp(rows[0]);
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM categories WHERE id = $1 AND store_id = $2 RETURNING *`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};
