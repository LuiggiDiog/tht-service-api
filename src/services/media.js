import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { URL_MEDIA_SERVICE, SLUG_MEDIA_SERVICE } from "../config.js";

const baseURL = `${URL_MEDIA_SERVICE}/api/projects`;

export const mediaUpload = async (file) => {
  const url = `${baseURL}/${SLUG_MEDIA_SERVICE}/media/upload`;
  console.log("url", url);

  // Usar FormData compatible con node-fetch
  const formData = new FormData();

  // Manejar archivos de multer que vienen con buffer
  if (file.buffer) {
    // Crear Blob desde buffer para FormData
    const blob = new Blob([file.buffer], {
      type: file.mimetype || "application/octet-stream",
    });
    formData.append("file", blob, file.originalname || file.name || "file");
  } else if (file.path) {
    // Para archivos de multer con diskStorage (si se usa en el futuro)
    const fs = await import("fs");
    const fileBuffer = await fs.promises.readFile(file.path);
    const blob = new Blob([fileBuffer], {
      type: file.mimetype || "application/octet-stream",
    });
    formData.append("file", blob, file.originalname || file.name || "file");
  } else {
    // Fallback: intentar usar el archivo directamente
    formData.append("file", file);
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload media");
  }

  const data = await response.json();
  return data;
};
