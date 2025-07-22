import Joi from "joi";

const orderItemSchema = Joi.object({
  order_id: Joi.number().required(),
  product_id: Joi.number().required(),
  quantity: Joi.number().min(1).required(),
  unit_price: Joi.number().min(0).required(),
});

export const getOrderItems = async (req, res) => {
  const { order_id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [order_id]
  );
  return res.resp(rows);
};

export const addOrderItem = async (req, res) => {
  const { error } = orderItemSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { order_id, product_id, quantity, unit_price } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING *`,
    [order_id, product_id, quantity, unit_price]
  );
  return res.resp(rows[0]);
};

export const removeOrderItem = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM order_items WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.resp(rows[0]);
};
