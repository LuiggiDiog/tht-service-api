export const NODE_ENV = process.env.NODE_ENV;
export const APP_URL_FRONT = process.env.APP_URL_FRONT;
export const URL_IMAGE = process.env.URL_IMAGE;
export const URL_MEDIA_SERVICE = process.env.URL_MEDIA_SERVICE;
export const SLUG_MEDIA_SERVICE = process.env.SLUG_MEDIA_SERVICE;
console.log("SLUG_MEDIA_SERVICE", SLUG_MEDIA_SERVICE);
export const SECRET = process.env.SECRET;

// Configuración de email
export const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
export const SMTP_PORT = process.env.SMTP_PORT || 587;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;

export const isProduction = NODE_ENV === "production";
