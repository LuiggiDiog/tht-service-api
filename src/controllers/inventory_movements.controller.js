import Joi from "joi";

const inventoryMovementSchema = Joi.object({
  store_id: Joi.number().required(),
  product_id: Joi.number().required(),
  change_qty: Joi.number().required(),
  reason: Joi.string().required(),
  occurred_at: Joi.date().optional(),
});

export const getInventoryMovements = async (req, res) => {
  const { product_id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM inventory_movements WHERE product_id = $1`,
    [product_id]
  );
  return res.resp(rows);
};

export const createInventoryMovement = async (req, res) => {
  const { error } = inventoryMovementSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { store_id, product_id, change_qty, reason, occurred_at } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO inventory_movements (store_id, product_id, change_qty, reason, occurred_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [store_id, product_id, change_qty, reason, occurred_at]
  );
  return res.resp(rows[0]);
};
