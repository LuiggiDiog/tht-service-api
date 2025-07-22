import Pool from "pg-pool";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Configurar dotenv para cargar las variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// Verificar las variables de entorno después de cargarlas
console.log("Variables de entorno en connection.js:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? "****" : undefined,
  database: process.env.DB_NAME,
  sslmode: process.env.DB_SSL_MODE,
  ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : undefined,
});

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  sslmode: process.env.DB_SSL_MODE,
  ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : undefined,
});

pool
  .connect()
  .then((client) => {
    console.log("Connected to the database");
    client.release();
  })
  .catch((err) => {
    console.log("Error connecting to database: ", err);
  });
