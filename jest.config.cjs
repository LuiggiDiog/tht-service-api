/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",

  // 1) Transforma todos los .js con babel-jest y tu config
  transform: {
    "^.+\\.js$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },

  // 2) Extensiones que Jest debería reconocer
  moduleFileExtensions: ["js", "json"],

  // 3) Patrón para localizar tus tests
  testMatch: ["**/test/**/*.test.js"],
};
