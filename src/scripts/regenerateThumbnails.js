import { pool } from "../connection.js";
import { saveImage, removeImage } from "../services/images.js";
import { generateFileName } from "../utils/fileUtils.js";
import { URL_IMAGE } from "../config.js";
import fetch from "node-fetch";

const imageDir = "shop-products";

async function regenerateThumbnails() {
  try {
    // Iniciamos una transacción
    await pool.query("BEGIN");

    // Obtenemos todos los productos que tienen imágenes
    const { rows } = await pool.query(`
      SELECT id, store_id, images_url, thumb_url 
      FROM products 
      WHERE images_url IS NOT NULL 
      AND array_length(images_url, 1) > 0
      ORDER BY id
    `);

    console.log(
      `Encontrados ${rows.length} productos para regenerar thumbnails`
    );

    for (const product of rows) {
      try {
        // Tomamos la primera imagen del array
        const firstImageUrl = product.images_url[0];

        // Descargamos la imagen
        const response = await fetch(URL_IMAGE + firstImageUrl);
        if (!response.ok) {
          console.error(
            `Error al descargar imagen para producto ${product.id}: ${response.statusText}`
          );
          continue;
        }

        const imageBuffer = await response.buffer();
        const base64Image = imageBuffer.toString("base64");

        // Generamos un nuevo nombre de archivo
        const nameImage = generateFileName(product.store_id);

        // Guardamos la imagen y generamos el thumbnail
        const { urlImage, urlThumbnail } = await saveImage(
          nameImage,
          base64Image,
          imageDir,
          true // isFirst = true para generar thumbnail
        );

        // Si el producto ya tenía un thumbnail, lo eliminamos
        if (product.thumb_url) {
          await removeImage(product.thumb_url);
        }

        // Actualizamos el producto con el nuevo thumbnail
        await pool.query(`UPDATE products SET thumb_url = $1 WHERE id = $2`, [
          urlThumbnail,
          product.id,
        ]);

        console.log(`Producto ${product.id} actualizado exitosamente`);
      } catch (error) {
        console.error(`Error procesando producto ${product.id}:`, error);
        // Continuamos con el siguiente producto
        continue;
      }
    }

    // Confirmamos la transacción
    await pool.query("COMMIT");
    console.log("Regeneración de thumbnails completada exitosamente");
  } catch (error) {
    // Si hay error, revertimos la transacción
    await pool.query("ROLLBACK");
    console.error("Error durante la regeneración de thumbnails:", error);
    throw error;
  }
}

// Ejecutamos el script
regenerateThumbnails()
  .then(() => {
    console.log("Proceso de regeneración de thumbnails finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en el proceso de regeneración de thumbnails:", error);
    process.exit(1);
  });
