import { Router } from "express";
import {
  getProductCategories,
  addProductCategory,
  removeProductCategory,
} from "../controllers/product_categories.controller.js";

const router = Router();

router.get("/:product_id", getProductCategories);
router.post("/", addProductCategory);
router.delete("/:product_id/:category_id", removeProductCategory);

export default router;
