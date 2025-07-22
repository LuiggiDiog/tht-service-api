import { URL_IMAGE } from "../config.js";
import { ACTIVE_STATUS, NEXT_AVAILABLE_STATUS } from "../utils/contanst.js";

export const getProducts = async (req, res) => {
  const { store_id } = req.query;
  const { rows } = await req.exec(
    `SELECT *,
      CASE 
        WHEN stock > 0 THEN true 
        ELSE false 
      END as has_stock
    FROM products 
    WHERE (status = $2 OR status = $3) AND store_id = $1 
    ORDER BY has_stock DESC, id DESC`,
    [store_id, ACTIVE_STATUS, NEXT_AVAILABLE_STATUS]
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
    data.has_stock = undefined; // Ocultamos el campo temporal
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

  data.cost = undefined;

  return res.resp(rows[0]);
};

export const getProductBySku = async (req, res) => {
  const { sku } = req.params;
  const { rows } = await req.exec(`SELECT * FROM products WHERE sku = $1`, [
    sku,
  ]);

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

  data.cost = undefined;

  return res.resp(data);
};

// Función para calcular la distancia de Levenshtein entre dos strings
function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  // matriz de (m+1) x (n+1)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));

  // inicialización
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // cálculo
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // borrar
        dp[i][j - 1] + 1, // insertar
        dp[i - 1][j - 1] + cost // sustituir
      );
    }
  }

  return dp[m][n];
}

export const postProductSuggestions = async (req, res) => {
  const { store_id, product_id } = req.body;

  // 1) Obtenemos el nombre del producto original
  const { rows: baseRows } = await req.exec(
    `SELECT name FROM products WHERE id = $1`,
    [product_id]
  );
  const baseName = baseRows[0]?.name || "";

  // 2) Traemos todos los productos activos del store (excepto el actual)
  const { rows } = await req.exec(
    `
      SELECT *, 
        CASE 
          WHEN stock > 0 THEN true 
          ELSE false 
        END as has_stock
      FROM products
      WHERE store_id = $1
        AND id != $2
        AND status = 'active'
    `,
    [store_id, product_id]
  );

  // 3) Calculamos la distancia y ordenamos
  const sorted = rows
    .map((data) => {
      const name = data.name || "";
      const dist = levenshtein(name.toLowerCase(), baseName.toLowerCase());
      return { data, dist };
    })
    .sort((a, b) => {
      // Primero ordenamos por stock (los que tienen stock van primero)
      if (a.data.has_stock !== b.data.has_stock) {
        return b.data.has_stock ? 1 : -1;
      }
      // Luego por similitud del nombre
      return a.dist - b.dist;
    })
    .slice(0, 4) // tomamos las 4 mejores
    .map(({ data }) => {
      // 4) Montamos las URLs y ocultamos el coste
      if (data.images_url) {
        const imagesUrl = [];
        for (const imageUrl of data.images_url)
          imagesUrl.push(URL_IMAGE + imageUrl);
        data.images_url = imagesUrl;
      }
      if (data.thumb_url) data.thumb_url = URL_IMAGE + data.thumb_url;
      data.cost = undefined;
      data.has_stock = undefined; // Ocultamos el campo temporal
      return data;
    });

  return res.resp(sorted);
};

export const searchProducts = async (req, res) => {
  const { store_id, query } = req.body;

  if (!query) {
    throw "BE001"; // Error de parámetros requeridos
  }

  // Ya no necesitamos normalizar el texto aquí
  const searchTerm = `%${query}%`;

  // Validamos si store_id existe y no es 0 (tanto en string como número)
  const hasStoreId = store_id && store_id !== "0" && store_id !== 0;

  const { rows } = await req.exec(
    `SELECT *,
      CASE 
        WHEN stock > 0 THEN true 
        ELSE false 
      END as has_stock
    FROM products 
    WHERE (status = $2 OR status = $3) 
      ${hasStoreId ? "AND store_id = $1" : ""}
      AND (
        UNACCENT(LOWER(name)) LIKE UNACCENT(LOWER(${hasStoreId ? "$4" : "$1"}))
        OR UNACCENT(LOWER(sku)) LIKE UNACCENT(LOWER(${
          hasStoreId ? "$4" : "$1"
        }))
      )
    ORDER BY has_stock DESC, id DESC`,
    hasStoreId
      ? [store_id, ACTIVE_STATUS, NEXT_AVAILABLE_STATUS, searchTerm]
      : [searchTerm, ACTIVE_STATUS, NEXT_AVAILABLE_STATUS]
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
    data.has_stock = undefined;
  }

  return res.resp(rows);
};

const buildProductOffersQuery = (hasStoreId, store_id) => {
  const baseQuery = `
    SELECT *,
      CASE 
        WHEN stock > 0 THEN true 
        ELSE false 
      END as has_stock
    FROM products 
    WHERE (status = $1 OR status = $2) 
      ${hasStoreId ? "AND store_id = $3" : ""}
      AND price_offer IS NOT NULL 
      AND price_offer > 0
    ORDER BY has_stock DESC, price_offer ASC`;

  return {
    query: baseQuery,
    params: hasStoreId
      ? [ACTIVE_STATUS, NEXT_AVAILABLE_STATUS, parseInt(store_id)]
      : [ACTIVE_STATUS, NEXT_AVAILABLE_STATUS],
  };
};

export const getProductOffers = async (req, res) => {
  const { store_id } = req.query;

  // Validamos si store_id existe y no es 0 (tanto en string como número)
  const hasStoreId = store_id && store_id !== "0" && store_id !== 0;

  const { query, params } = buildProductOffersQuery(hasStoreId, store_id);
  const { rows } = await req.exec(query, params);

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
    data.has_stock = undefined;
  }

  return res.resp(rows);
};
