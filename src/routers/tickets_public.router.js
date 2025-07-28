import { Router } from "express";
import { getTicketByPublicId } from "../controllers/tickets.controller.js";

const router = Router();

// Ruta pública para obtener ticket por public_id (sin autenticación)
router.get("/:public_id", getTicketByPublicId);

export default router;
