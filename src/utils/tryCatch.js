export const lstSuccess = [
  {
    code: "BS200",
    message: {
      es: "Petición exitosa",
      en: "Successful",
    },
    status: 200,
  },
];

const lstErr = [
  {
    code: "BE000",
    message: {
      es: "Error interno del servidor",
      en: "Internal Server Error",
    },
    status: 500,
  },
  {
    code: "BE001",
    message: {
      es: "No autorizado",
      en: "Unauthorized",
    },
    status: 401,
  },
  {
    code: "BE003",
    message: {
      es: "Prohibido",
      en: "Forbidden",
    },
    status: 403,
  },
  {
    code: "BE004",
    message: {
      es: "No encontrado",
      en: "Not Found",
    },
    status: 404,
  },
  {
    code: "BE005",
    message: {
      es: "Solicitud incorrecta",
      en: "Bad Request",
    },
    status: 400,
  },
  {
    code: "BE100",
    message: {
      es: "Revise los datos ingresados",
      en: "User not registered",
    },
    status: 400,
  },
  {
    code: "BE101",
    message: {
      es: "Usuario inactivo",
      en: "Inactive user",
    },
    status: 400,
  },
  {
    code: "BE102",
    message: {
      es: "El correo o la contraseña son incorrectos",
      en: "Incorrect email or password",
    },
    status: 400,
  },
  {
    code: "BE103",
    message: {
      es: "Token inválido",
      en: "Invalid token",
    },
    status: 400,
  },
  {
    code: "BE104",
    message: {
      es: "El correo ya está registrado",
      en: "Email already registered",
    },
    status: 400,
  },
  {
    code: "BE105",
    message: {
      es: "No tiene permiso",
      en: "No permission",
    },
    status: 400,
  },
  {
    code: "BE400",
    message: {
      es: "No se actualizó el registro",
      en: "The record was not updated",
    },
    status: 400,
  },
];

export function errHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      req.end && req.end();

      const langData = req.headers["accept-language"];
      const lang = langData || "es";

      const error = lstErr.find((e) => e.code === err);

      if (error === undefined) {
        console.log("Error: ErrHandler -> ", err);
        const errorDefault = lstErr[0];
        return res.status(errorDefault.status).json({
          code: errorDefault.code,
          message: errorDefault.message[lang],
        });
      }

      return res.status(error.status).json({
        code: error.code,
        message: error.message[lang],
      });
    }
  };
}

export function errHandlerAsyncModel(err, req, res, next) {
  console.error(err);

  req.end && req.end();

  const langData = req.headers["accept-language"];
  const lang = langData || "es";

  const error = lstErr.find((e) => e.code === err);

  if (error === undefined) {
    console.log("Error: ErrHandler -> ", err);
    const errorDefault = lstErr[0];
    return res.status(errorDefault.status).json({
      code: errorDefault.code,
      message: errorDefault.message[lang],
    });
  }

  return res.status(error.status).json({
    code: error.code,
    message: error.message[lang],
  });
}
