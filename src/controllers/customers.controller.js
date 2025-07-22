import {
  customerSchema,
  customerSchemaCreate,
} from "../schemas/customer.schema.js";

export const getCustomers = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM customers ORDER BY created_at DESC`
  );
  return res.resp(rows);
};

export const getCustomer = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(`SELECT * FROM customers WHERE id = $1`, [
    id,
  ]);
  return res.resp(rows[0]);
};

export const createCustomer = async (req, res) => {
  const { error } = customerSchemaCreate.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE100";
  }

  const { name, last_name, email, phone, address, company, rfc, status } =
    req.body;

  // Validar que el correo sea único
  const { rows: emailRows } = await req.exec(
    `SELECT id FROM customers WHERE email = $1`,
    [email]
  );
  if (emailRows.length > 0) {
    throw "BE104"; // Correo ya registrado
  }

  const { rows } = await req.exec(
    `INSERT INTO customers (name, last_name, email, phone, address, company, rfc, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, last_name, email, phone, address, company, rfc, status || "active"]
  );
  return res.resp(rows[0]);
};

export const updateCustomer = async (req, res) => {
  const { error } = customerSchema.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE100";
  }

  const { id } = req.params;
  const { name, last_name, email, phone, address, company, rfc, status } =
    req.body;

  // Validar que el correo sea único (excluyendo el propio cliente)
  const { rows: emailRows } = await req.exec(
    `SELECT id FROM customers WHERE email = $1 AND id != $2`,
    [email, id]
  );
  if (emailRows.length > 0) {
    throw "BE104"; // Correo ya registrado en otro cliente
  }

  const { rows } = await req.exec(
    `UPDATE customers SET 
       name = $1, 
       last_name = $2, 
       email = $3, 
       phone = $4, 
       address = $5, 
       company = $6, 
       rfc = $7, 
       status = $8, 
       updated_at = NOW() 
     WHERE id = $9 RETURNING *`,
    [name, last_name, email, phone, address, company, rfc, status, id]
  );
  return res.resp(rows[0]);
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM customers WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.resp(rows[0]);
};
