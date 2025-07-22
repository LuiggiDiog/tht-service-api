import { userSchema } from "../schemas/user.schema.js";

export const getUsers = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM users WHERE status = 'active'`
  );
  return res.resp(rows);
};

export const getUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(`SELECT * FROM users WHERE id = $1`, [id]);
  return res.resp(rows[0]);
};

export const createUser = async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { name, email, password, role } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, password, role]
  );
  return res.resp(rows[0]);
};

export const updateUser = async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { id } = req.params;
  const { name, email, password, role } = req.body;
  const { rows } = await req.exec(
    `UPDATE users SET name = $1, email = $2, password = $3, role = $4 WHERE id = $5 RETURNING *`,
    [name, email, password, role, id]
  );
  return res.resp(rows[0]);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `DELETE FROM users WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.resp(rows[0]);
};
