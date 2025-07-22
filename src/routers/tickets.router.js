import { Router } from "express";
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  createTicketEvidence,
  getTicketEvidences,
  createPartChange,
  getPartChanges,
  getTicketsByTechnician,
  getTicketsByCustomer,
} from "../controllers/tickets.controller.js";

const router = Router();

// Rutas principales de tickets
router.get("/", getTickets);
router.get("/:id", getTicket);
router.post("/", createTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);

// Rutas para evidencias
router.post("/evidences", createTicketEvidence);
router.get("/:ticket_id/evidences", getTicketEvidences);

// Rutas para cambios de piezas
router.post("/part-changes", createPartChange);
router.get("/:ticket_id/part-changes", getPartChanges);

// Rutas por técnico y cliente
router.get("/technician/:technician_id", getTicketsByTechnician);
router.get("/customer/:customer_id", getTicketsByCustomer);

export default router;
