import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { SECRET } from "../config.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await req.exec("select * from users where email = $1", [
    email,
  ]);

  if (!rows.length) throw "BE102";
  const userData = rows[0];

  const passCorrect = bcrypt.compareSync(password, userData.password);
  if (!passCorrect) throw "BE102";

  if (userData.status !== "active") throw "BE101";

  const userDataToken = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
  };

  const token = jwt.sign(userDataToken, process.env.SECRET, {
    expiresIn: "7d",
  });

  userData.password = undefined;

  return res.resp({ isLogged: true, token, user: userData });
};

export const restoreLogin = async (req, res) => {
  const decoded = req.user;

  const { rows } = await req.exec("select * from users where id = $1", [
    decoded.id,
  ]);

  const userData = rows[0];

  if (userData.status !== "active") throw "BE101";

  userData.password = undefined;

  const userDataToken = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
  };

  const token = jwt.sign(userDataToken, process.env.SECRET, {
    expiresIn: "7d",
  });

  userData.password = undefined;

  return res.resp({ isLogged: true, token, user: userData });
};

export const loginEcomGoogle = async (req, res) => {
  const { token } = req.body;

  const decoded = jwtDecode(token);

  if (!decoded) {
    throw "BE103";
  }

  const response = await req.exec(
    `select * from customers where email = '${decoded.email}'`
  );

  let user = response.rows[0];

  if (!user) {
    const { sub, name, email, email_verified, picture } = decoded;

    const newUser = await req.exec(
      "insert into customers (name, email) values ($1, $2) returning *",
      [name, email]
    );

    user = newUser.rows[0];
  }

  const userForToken = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const newToken = jwt.sign(userForToken, SECRET, {
    expiresIn: "7d",
  });

  res.resp({
    isAuthenticated: true,
    user,
    token: newToken,
  });
};

export const restoreLoginEcom = async (req, res) => {
  const { user: decoded } = req;

  const response = await req.exec(
    `select * from customers where email = '${decoded.email}'`
  );

  const user = response.rows[0];

  if (!user) {
    throw "BE103";
  }

  const userForToken = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const newToken = jwt.sign(userForToken, SECRET, {
    expiresIn: "7d",
  });

  res.resp({
    isAuthenticated: true,
    user,
    token: newToken,
  });
};
