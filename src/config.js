export const NODE_ENV = process.env.NODE_ENV;
export const URL_IMAGE = process.env.URL_IMAGE;
export const URL_MEDIA_SERVICE = process.env.URL_MEDIA_SERVICE;
export const SLUG_MEDIA_SERVICE = process.env.SLUG_MEDIA_SERVICE;
console.log("SLUG_MEDIA_SERVICE", SLUG_MEDIA_SERVICE);
export const SECRET = process.env.SECRET;

export const isProduction = NODE_ENV === "production";
