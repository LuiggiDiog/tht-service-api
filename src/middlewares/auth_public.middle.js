import jwt from "jsonwebtoken";

const authMiddle = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw "BE001";

  const token = authHeader.split(" ")[1];
  if (!token) throw "BE001";

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.resp({}, { type: "warn", message: "Sesión expirada" });
      }

      throw "BE103";
    }
    req.user = user;
    next();
  });
};

export default authMiddle;
