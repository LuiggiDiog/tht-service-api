import { Router } from "express";
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/payments.controller.js";

const router = Router();

router.get("/:order_id", getPayments);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
