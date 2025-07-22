import { pool } from "../connection.js";
import { generateSKU } from "../controllers/products.controller.js";

async function migrateProductSKUs() {
  try {
    // Iniciamos una transacción
    await pool.query("BEGIN");

    // Primero, agregamos la columna sku si no existe
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'sku'
        ) THEN
          ALTER TABLE products ADD COLUMN sku VARCHAR(20) UNIQUE;
        END IF;
      END $$;
    `);

    // Obtenemos todos los productos que tienen SKU vacío
    const { rows } = await pool.query(`
      SELECT id, name, sku 
      FROM products 
      WHERE sku = '' OR sku IS NULL
      ORDER BY id
    `);

    console.log(
      `Encontrados ${rows.length} productos con SKU vacío para migrar`
    );

    for (const product of rows) {
      const sku = generateSKU(product.name);

      // Actualizamos el producto con el nuevo SKU
      await pool.query(
        `
        UPDATE products 
        SET sku = $2
        WHERE id = $1
      `,
        [product.id, sku]
      );

      console.log(`Producto ${product.id} migrado con SKU: ${sku}`);
    }

    // Confirmamos la transacción
    await pool.query("COMMIT");
    console.log("Migración de SKUs completada exitosamente");
  } catch (error) {
    // Si hay error, revertimos la transacción
    await pool.query("ROLLBACK");
    console.error("Error durante la migración de SKUs:", error);
    throw error;
  }
}

// Ejecutamos la migración
migrateProductSKUs()
  .then(() => {
    console.log("Proceso de migración de SKUs finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en el proceso de migración de SKUs:", error);
    process.exit(1);
  });
