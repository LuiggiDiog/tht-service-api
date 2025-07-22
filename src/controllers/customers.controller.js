import Joi from "joi";

const customerSchema = Joi.object({
  store_id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
});

export const getCustomers = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM customers WHERE store_id = $1`,
    [req.store_id]
  );
  return res.resp(rows);
};

export const getCustomer = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM customers WHERE id = $1 AND store_id = $2`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};

export const createCustomer = async (req, res) => {
  const { error } = customerSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { store_id, name, email, phone } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO customers (store_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *`,
    [store_id, name, email, phone]
  );
  return res.resp(rows[0]);
};

export const updateCustomer = async (req, res) => {
  /* const { error } = customerSchema.validate(req.body);
  if (error) {
    throw "BE005";
  } */

  const { id } = req.params;
  const { name, phone } = req.body;
  const { rows } = await req.exec(
    `UPDATE customers SET name = $1, phone = $2 WHERE id = $3 RETURNING *`,
    [name, phone, id]
  );
  return res.resp(rows[0]);
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM customers WHERE id = $1 AND store_id = $2 RETURNING *`,
    [id, req.store_id]
  );
  return res.resp(rows[0]);
};
