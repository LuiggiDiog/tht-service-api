import { Router } from "express";
import {
  getInventoryMovements,
  createInventoryMovement,
} from "../controllers/inventory_movements.controller.js";

const router = Router();

router.get("/:product_id", getInventoryMovements);
router.post("/", createInventoryMovement);

export default router;
