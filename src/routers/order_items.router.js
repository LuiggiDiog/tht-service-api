import { Router } from "express";
import {
  getOrderItems,
  addOrderItem,
  removeOrderItem,
} from "../controllers/order_items.controller.js";

const router = Router();

router.get("/:order_id", getOrderItems);
router.post("/", addOrderItem);
router.delete("/:id", removeOrderItem);

export default router;
