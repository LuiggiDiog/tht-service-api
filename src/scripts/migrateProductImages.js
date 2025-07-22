import { pool } from "../connection.js";
import { URL_IMAGE } from "../config.js";

async function migrateProductImages() {
  try {
    // Iniciamos una transacción
    await pool.query("BEGIN");

    // Primero, agregamos la columna images_url si no existe
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'images_url'
        ) THEN
          ALTER TABLE products ADD COLUMN images_url TEXT[] DEFAULT '{}';
        END IF;
      END $$;
    `);

    // Obtenemos todos los productos que tienen image_url pero no images_url
    const { rows } = await pool.query(`
      SELECT id, image_url, images_url 
      FROM products 
      WHERE image_url IS NOT NULL 
      AND (images_url IS NULL OR images_url = '{}')
      ORDER BY id
    `);

    console.log(`Encontrados ${rows.length} productos para migrar`);

    for (const product of rows) {
      let imageUrl = product.image_url;
      let imagesUrl = product.images_url;
      if (imageUrl) {
        imagesUrl = [imageUrl];
      }

      // Actualizamos el producto con la nueva estructura
      await pool.query(
        `
        UPDATE products 
        SET images_url = $2, 
            image_url = NULL 
        WHERE id = $1
      `,
        [product.id, imagesUrl]
      );

      console.log(`Producto ${product.id} migrado exitosamente`);
    }

    // Confirmamos la transacción
    await pool.query("COMMIT");
    console.log("Migración completada exitosamente");
  } catch (error) {
    // Si hay error, revertimos la transacción
    await pool.query("ROLLBACK");
    console.error("Error durante la migración:", error);
    throw error;
  }
}

// Ejecutamos la migración
migrateProductImages()
  .then(() => {
    console.log("Proceso de migración finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en el proceso de migración:", error);
    process.exit(1);
  });
