import { isProduction, URL_IMAGE } from "../config.js";
import { productSchema } from "../schemas/product.schema.js";
import { saveImage, removeImage, removeImages } from "../services/images.js";
import { ACTIVE_STATUS, DELETE_STATUS } from "../utils/contanst.js";
import { generateFileName } from "../utils/fileUtils.js";

const imageDir = "shop-products";

// Función para generar SKU automático
export const generateSKU = (name) => {
  // Limpiamos el nombre de caracteres especiales y símbolos
  const cleanName = name
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ") // Reemplaza caracteres especiales con espacio
    .replace(/\s+/g, " ") // Reemplaza múltiples espacios con uno solo
    .trim();

  // Limpiamos el nombre y tomamos máximo 3 palabras
  const words = cleanName
    .split(" ")
    .filter((word) => {
      // Solo consideramos palabras que:
      // 1. Tengan al menos 2 caracteres
      // 2. No sean solo números
      // 3. No contengan solo caracteres especiales
      return word.length >= 2 && !/^\d+$/.test(word) && /[a-zA-Z]/.test(word);
    })
    .slice(0, 3);

  // Si no hay palabras válidas, usamos un prefijo por defecto
  if (words.length === 0) {
    words.push("PRD");
  }

  // Procesamos cada palabra para asegurar 3 caracteres
  const prefix = words
    .map((word) => {
      // Tomamos solo letras y números, convertimos a mayúsculas
      const base = word
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase();
      // Si la palabra tiene menos de 3 letras, rellenamos con X
      return base.padEnd(3, "X");
    })
    .join("-");

  // Agregamos un timestamp para hacerlo único
  const timestamp = Date.now().toString().slice(-4);

  // Generamos un número aleatorio de 3 dígitos
  const random = Math.floor(Math.random() * 900 + 100);

  return `${prefix}-${timestamp}-${random}`;
};

export const getProducts = async (req, res) => {
  const { store_id } = req.query;
  const { rows } = await req.exec(
    `SELECT * FROM products WHERE status != $2 AND store_id = $1 ORDER BY id DESC`,
    [store_id, DELETE_STATUS]
  );

  for (let i = 0; i < rows.length; i++) {
    const data = rows[i];
    if (data.images_url) {
      const imagesUrl = [];

      for (const imageUrl of data.images_url)
        imagesUrl.push(URL_IMAGE + imageUrl);

      data.images_url = imagesUrl;
    }

    if (data.thumb_url) {
      data.thumb_url = URL_IMAGE + data.thumb_url;
    }
    data.cost = undefined;
  }

  return res.resp(rows);
};

export const getProduct = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(`SELECT * FROM products WHERE id = $1`, [id]);
  const data = rows[0];
  if (!data) {
    throw "BE004";
  }

  if (data.images_url) {
    const imagesUrl = [];
    for (const imageUrl of data.images_url)
      imagesUrl.push(URL_IMAGE + imageUrl);
    data.images_url = imagesUrl;
  }

  if (data.thumb_url) {
    data.thumb_url = URL_IMAGE + data.thumb_url;
  }

  return res.resp(rows[0]);
};

export const createProduct = async (req, res) => {
  /* const { error } = productSchema.validate(req.body);
  if (error) {
    throw "BE005";
  } */

  const currentStoreId = req.storeId;

  const {
    name,
    description,
    cost,
    price,
    price_offer,
    stock,
    metadata,
    images = [],
    price_package,
    package_qty,
    status,
  } = req.body;

  // Generamos el SKU automáticamente
  const sku = generateSKU(name);

  const { rows } = await req.exec(
    `INSERT INTO products (store_id, sku, name, description, cost, price, price_offer, stock, metadata, price_package, package_qty, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      currentStoreId,
      sku,
      name,
      description,
      cost,
      price,
      price_offer || 0,
      stock || 0,
      metadata || {},
      price_package || 0,
      package_qty || 0,
      status || ACTIVE_STATUS,
    ]
  );

  if (isProduction && images.length > 0) {
    const idProduct = rows[0].id;

    const imagesUrl = [];
    let imagesThumbnail;

    for (const [i, image] of images.entries()) {
      const nameImage = generateFileName(currentStoreId);
      const isFirst = i === 0;
      const { urlImage, urlThumbnail } = await saveImage(
        nameImage,
        image,
        imageDir,
        isFirst
      );

      if (isFirst) {
        imagesThumbnail = urlThumbnail;
      }

      imagesUrl.push(urlImage);
    }

    const { rows: rowNew } = await req.exec(
      `update products set images_url = $2, thumb_url = $3 where id = $1 RETURNING *`,
      [idProduct, imagesUrl, imagesThumbnail]
    );

    return res.resp(rowNew[0]);
  }

  return res.resp(rows[0]);
};

export const updateProduct = async (req, res) => {
  /* const { error } = productSchema.validate(req.body);
  if (error) {
    throw "BE005";
  } */

  const currentStoreId = req.storeId;

  const { id } = req.params;
  const {
    sku,
    name,
    description,
    cost,
    price,
    price_offer,
    stock,
    metadata,
    images = [],
    price_package,
    package_qty,
    status,
  } = req.body;

  const { rows } = await req.exec(
    `UPDATE products SET store_id = $1, sku = $2, name = $3, description = $4, cost = $5, price = $6, price_offer = $7, stock = $8, metadata = $9, price_package = $10, package_qty = $11, status = $12 WHERE id = $13 RETURNING *`,
    [
      currentStoreId,
      sku,
      name,
      description,
      cost,
      price,
      price_offer || 0,
      stock || 0,
      metadata || {},
      price_package || 0,
      package_qty || 0,
      status || ACTIVE_STATUS,
      id,
    ]
  );

  const data = rows[0];

  if (isProduction && images.length > 0) {
    const imagesUrl = [];
    let imagesThumbnail;

    for (const [i, image] of images.entries()) {
      const nameImage = generateFileName(currentStoreId);
      const isFirst = i === 0;
      const { urlImage, urlThumbnail } = await saveImage(
        nameImage,
        image,
        imageDir,
        isFirst
      );

      if (isFirst) {
        imagesThumbnail = urlThumbnail;
      }

      imagesUrl.push(urlImage);
    }

    const { rows: rowNew } = await req.exec(
      `update products set images_url = $2, thumb_url = $3 where id = $1 RETURNING *`,
      [id, imagesUrl, imagesThumbnail]
    );

    await removeImages(data.images_url);
    await removeImage(data.thumb_url);

    return res.resp(rowNew[0]);
  }

  return res.resp(data);
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `UPDATE products SET status = $2 WHERE id = $1 RETURNING *`,
    [id, DELETE_STATUS]
  );
  return res.resp(rows[0]);
};
