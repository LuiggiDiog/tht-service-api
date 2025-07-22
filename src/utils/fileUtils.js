import { v4 as uuidv4 } from "uuid";

export function generateFileName(baseName) {
  const baseNameStr = String(baseName);
  const slug = baseNameStr
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const id = uuidv4().slice(0, 8); // identificador corto y único

  return `${slug}-${id}`;
}
