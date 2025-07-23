import { userSchema, userSchemaCreate } from "../schemas/user.schema.js";
import bcrypt from "bcrypt";
import { DELETE_STATUS } from "../utils/contanst.js";

export const getUsers = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM users WHERE status != $1 ORDER BY created_at asc`,
    [DELETE_STATUS]
  );
  // Eliminar password de cada usuario
  const users = rows.map(({ password, ...rest }) => rest);
  return res.resp(users);
};

export const getUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(`SELECT * FROM users WHERE id = $1`, [id]);
  if (!rows[0]) return res.resp(undefined);
  // Eliminar password del usuario
  const { password, ...userWithoutPassword } = rows[0];
  return res.resp(userWithoutPassword);
};

export const createUser = async (req, res) => {
  const { error } = userSchemaCreate.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE005";
  }

  const { name, email, password, role, branch } = req.body;

  // Validar que el correo sea único
  const { rows: emailRows } = await req.exec(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (emailRows.length > 0) {
    throw "BE104"; // Correo ya registrado
  }

  // Encriptar la contraseña
  const hashedPassword = bcrypt.hashSync(password, 10);

  const { rows } = await req.exec(
    `INSERT INTO users (name, email, branch, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, branch, hashedPassword, role]
  );
  return res.resp(rows[0]);
};

export const updateUser = async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE005";
  }

  const { id } = req.params;
  const { name, email, password, role, branch } = req.body;

  // Validar que el correo sea único (excluyendo el propio usuario)
  const { rows: emailRows } = await req.exec(
    `SELECT id FROM users WHERE email = $1 AND id != $2`,
    [email, id]
  );
  if (emailRows.length > 0) {
    throw "BE104"; // Correo ya registrado en otro usuario
  }

  // Encriptar la contraseña
  const hashedPassword = bcrypt.hashSync(password, 10);

  const { rows } = await req.exec(
    `UPDATE users SET name = $1, email = $2, branch = $3, password = $4, role = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
    [name, email, branch, hashedPassword, role, id]
  );
  return res.resp(rows[0]);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [DELETE_STATUS, id]
  );
  return res.resp(rows[0]);
};
