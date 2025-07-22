import fetch from "node-fetch";
import { URL_IMAGE } from "../config.js";

export const saveImage = async (
  name,
  image,
  dir = "products",
  thumbnail = true
) => {
  const response = await fetch(`${URL_IMAGE}/images/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, image, dir, thumbnail }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error response:", text);
  }

  const data = await response.json();
  return data;
};

export const removeImage = async (path) => {
  const response = await fetch(`${URL_IMAGE}/images/remove-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  const data = await response.json();
  return data;
};

export const removeImages = async (paths) => {
  const responseReturn = [];

  for (const path of paths) {
    const response = await removeImage(path);
    responseReturn.push(response);
  }

  return responseReturn;
};
