module.exports = function (api) {
  const isTest = api.env("test"); // true cuando Jest corre (NODE_ENV=test)
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "current" },
          modules: isTest ? "auto" : false, // en test: convierte import→require; en build: deja ESM
        },
      ],
    ],
  };
};
