import { Router } from "express";
import multer from "multer";
import {
  getTickets,
  getTicket,
  getTicketByPublicId,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
  createTicketEvidence,
  getTicketEvidences,
  createPartChange,
  getPartChanges,
  getTicketsByTechnician,
  getTicketsByCustomer,
  deleteTicketEvidence,
  closeTicket,
} from "../controllers/tickets.controller.js";

// Configuración de multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB máximo por archivo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes y videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen y video"), false);
    }
  },
});

const router = Router();

// Rutas principales de tickets
router.get("/", getTickets);
router.get("/:id", getTicket);
router.get("/public/:public_id", getTicketByPublicId);
router.post("/", createTicket);
router.put("/:id", updateTicket);
router.put("/:id/status", changeTicketStatus);
router.put("/:id/close", closeTicket);
router.delete("/:id", deleteTicket);

// Rutas para evidencias - usar multer para manejar archivos
router.post("/evidences", upload.array("files", 10), createTicketEvidence);
router.get("/:ticket_id/evidences", getTicketEvidences);
router.delete("/evidences/:id", deleteTicketEvidence);

// Rutas para cambios de piezas
router.post("/part-changes", createPartChange);
router.get("/:ticket_id/part-changes", getPartChanges);

// Rutas por técnico y cliente
router.get("/technician/:technician_id", getTicketsByTechnician);
router.get("/customer/:customer_id", getTicketsByCustomer);

export default router;
