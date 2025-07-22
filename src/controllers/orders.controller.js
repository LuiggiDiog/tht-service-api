import Joi from "joi";

const orderSchema = Joi.object({
  store_id: Joi.number().required(),
  customer_id: Joi.number().required(),
  total_amount: Joi.number().min(0).required(),
  status: Joi.string()
    .valid("pending", "completed", "cancelled")
    .default("pending"),
});

export const getOrders = async (req, res) => {
  const { rows } = await req.exec(`SELECT * FROM orders WHERE store_id = $1`, [
    req.store_id,
  ]);
  return res.resp(rows);
};

export const getOrder = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM orders WHERE id = $1 AND store_id = $2`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};

export const createOrder = async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { store_id, customer_id, total_amount, status } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO orders (store_id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4) RETURNING *`,
    [store_id, customer_id, total_amount, status]
  );
  return res.resp(rows[0]);
};

export const updateOrder = async (req, res) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { id } = req.params;
  const { store_id, customer_id, total_amount, status } = req.body;
  const { rows } = await req.exec(
    `UPDATE orders SET store_id = $1, customer_id = $2, total_amount = $3, status = $4 WHERE id = $5 RETURNING *`,
    [store_id, customer_id, total_amount, status, id]
  );
  return res.resp(rows[0]);
};

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM orders WHERE id = $1 AND store_id = $2 RETURNING *`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};
