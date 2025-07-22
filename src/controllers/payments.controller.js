import Joi from "joi";

const paymentSchema = Joi.object({
  order_id: Joi.number().required(),
  provider: Joi.string().default("transfer"),
  amount: Joi.number().min(0).required(),
  status: Joi.string()
    .valid("pending", "completed", "failed")
    .default("pending"),
  paid_at: Joi.date().optional(),
});

export const getPayments = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM payments WHERE order_id = $1`,
    [req.params.order_id]
  );
  return res.resp(rows);
};

export const createPayment = async (req, res) => {
  const { error } = paymentSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { order_id, provider, amount, status, paid_at } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO payments (order_id, provider, amount, status, paid_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [order_id, provider, amount, status, paid_at]
  );
  return res.resp(rows[0]);
};

export const updatePayment = async (req, res) => {
  const { error } = paymentSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { id } = req.params;
  const { order_id, provider, amount, status, paid_at } = req.body;
  const { rows } = await req.exec(
    `UPDATE payments SET order_id = $1, provider = $2, amount = $3, status = $4, paid_at = $5 WHERE id = $6 RETURNING *`,
    [order_id, provider, amount, status, paid_at, id]
  );
  return res.resp(rows[0]);
};

export const deletePayment = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM payments WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.resp(rows[0]);
};
