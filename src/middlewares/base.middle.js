import { pool } from "../connection.js";

const baseMiddle = async (req, res, next) => {
  const exec = (...args) => pool.query(...args);
  req.exec = exec;
  //req.end = end;
  res.resp = (json = {}, other = {}) => {
    //end();
    const jsonResp = {
      code: "BS200",
      message: "Success",
      data: json,
    };

    if (Object.keys(other).length) {
      jsonResp.other = other;
    }

    return res.json(jsonResp);
  };
  next();
};

export default baseMiddle;
