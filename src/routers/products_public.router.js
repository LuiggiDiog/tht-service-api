import { Router } from "express";
import {
  getProducts,
  getProduct,
  postProductSuggestions,
  getProductBySku,
  searchProducts,
  getProductOffers,
} from "../controllers/products_public.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/offers", getProductOffers);
router.get("/sku/:sku", getProductBySku);
router.get("/:id", getProduct);
router.post("/suggestions", postProductSuggestions);
router.post("/search", searchProducts);

export default router;
