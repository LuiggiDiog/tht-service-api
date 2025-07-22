import Joi from "joi";
import { generateFileName } from "../utils/fileUtils.js";
import { removeImage, saveImage } from "../services/images.js";
import { URL_IMAGE } from "../config.js";

const storeSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  domain: Joi.string().required(),
  config: Joi.object().required(),
});

const imageDir = "shop-assets";

export const getStores = async (req, res) => {
  const { rows } = await req.exec(
    `SELECT * FROM stores WHERE status = 'active' ORDER BY id`
  );

  for (let i = 0; i < rows.length; i++) {
    const data = rows[i];

    if (data.logo_url) {
      data.logo_url = URL_IMAGE + data.logo_url;
    }
    if (data.logo_thumb_url) {
      data.logo_thumb_url = URL_IMAGE + data.logo_thumb_url;
    }

    if (data.banner_url) {
      data.banner_url = URL_IMAGE + data.banner_url;
    }
    if (data.banner_thumb_url) {
      data.banner_thumb_url = URL_IMAGE + data.banner_thumb_url;
    }
  }

  return res.resp(rows);
};

export const getStore = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM stores WHERE id = $1 AND status = 'active'`,
    [id]
  );

  const data = rows[0];
  if (!data) {
    throw "BE004";
  }

  if (data.logo_url) {
    data.logo_url = URL_IMAGE + data.logo_url;
  }
  if (data.logo_thumb_url) {
    data.logo_thumb_url = URL_IMAGE + data.logo_thumb_url;
  }

  if (data.banner_url) {
    data.banner_url = URL_IMAGE + data.banner_url;
  }

  if (data.banner_thumb_url) {
    data.banner_thumb_url = URL_IMAGE + data.banner_thumb_url;
  }

  return res.resp(data);
};

export const getStoreByDomain = async (req, res) => {
  const { domain } = req.params;
  const { rows } = await req.exec(
    `SELECT * FROM stores WHERE domain = $1 AND status = 'active'`,
    [domain]
  );

  const data = rows[0];
  if (!data) {
    throw "BE004";
  }
  if (data.logo_url) {
    data.logo_url = URL_IMAGE + data.logo_url;
  }
  if (data.logo_thumb_url) {
    data.logo_thumb_url = URL_IMAGE + data.logo_thumb_url;
  }
  if (data.banner_url) {
    data.banner_url = URL_IMAGE + data.banner_url;
  }
  if (data.banner_thumb_url) {
    data.banner_thumb_url = URL_IMAGE + data.banner_thumb_url;
  }

  return res.resp(data);
};

export const createStore = async (req, res) => {
  /* const { error } = storeSchema.validate(req.body);
  if (error) {
    throw "BE005";
  } */

  const { name, phone, logo, banner } = req.body;
  const { rows } = await req.exec(
    `INSERT INTO stores (name, phone) VALUES ($1, $2, $3) RETURNING *`,
    [name, phone]
  );
  const store = rows[0];

  return res.resp(store);
};

export const updateStore = async (req, res) => {
  /* const { error } = storeSchema.validate(req.body);
  if (error) {
    throw "BE005";
  } */

  const { id } = req.params;
  const { name, phone, logo, banner } = req.body;
  const { rows } = await req.exec(
    `UPDATE stores SET name = $1, phone = $2 WHERE id = $3 RETURNING *`,
    [name, phone, id]
  );
  const store = rows[0];
  const storeId = store.id;

  if (logo) {
    const nameImage = generateFileName(storeId);
    const { urlImage, urlThumbnail } = await saveImage(
      nameImage,
      logo,
      imageDir
    );

    await req.exec(
      `UPDATE stores SET logo_url = $1, logo_thumb_url = $2 WHERE id = $3 RETURNING *`,
      [urlImage, urlThumbnail, storeId]
    );

    await removeImage(store.logo_url);
    await removeImage(store.logo_thumb_url);
    store.logo_url = urlImage;
    store.logo_thumb_url = urlThumbnail;
  }

  if (banner) {
    const nameImage = generateFileName(storeId);
    const { urlImage, urlThumbnail } = await saveImage(
      nameImage,
      banner,
      imageDir
    );

    await req.exec(
      `UPDATE stores SET banner_url = $1, banner_thumb_url = $2 WHERE id = $3 RETURNING *`,
      [urlImage, urlThumbnail, storeId]
    );

    await removeImage(store.banner_url);
    await removeImage(store.banner_thumb_url);
    store.banner_url = urlImage;
    store.banner_thumb_url = urlThumbnail;
  }

  return res.resp(store);
};

export const deleteStore = async (req, res) => {
  const { id } = req.params;
  const { rows } = await req.exec(
    `UPDATE stores SET status = 'deleted' WHERE id = $1 RETURNING *`,
    [id]
  );
  const store = rows[0];

  return res.resp(store);
};

// Agregar método para listar usuarios asociados a una tienda
export const getStoreUsers = async (req, res) => {
  const { storeId } = req.params;

  const { rows } = await req.exec(
    `SELECT u.* FROM users u
     INNER JOIN user_stores us ON u.id = us.user_id
     WHERE us.store_id = $1`,
    [storeId]
  );

  return res.resp(rows);
};

export const getStoresByUser = async (req, res) => {
  const { userId } = req.params;

  const isAdmin = Number(userId) === 1;

  let rows;
  if (isAdmin) {
    const result = await req.exec(`SELECT * FROM stores order by id`);
    rows = result.rows;
  } else {
    const result = await req.exec(
      `SELECT s.* FROM stores s
       INNER JOIN user_stores us ON s.id = us.store_id
       WHERE us.user_id = $1 order by s.id`,
      [userId]
    );
    rows = result.rows;
  }

  for (let i = 0; i < rows.length; i++) {
    const data = rows[i];

    if (data.logo_url) {
      data.logo_url = URL_IMAGE + data.logo_url;
    }
    if (data.logo_thumb_url) {
      data.logo_thumb_url = URL_IMAGE + data.logo_thumb_url;
    }

    if (data.banner_url) {
      data.banner_url = URL_IMAGE + data.banner_url;
    }
    if (data.banner_thumb_url) {
      data.banner_thumb_url = URL_IMAGE + data.banner_thumb_url;
    }
  }

  return res.resp(rows);
};
