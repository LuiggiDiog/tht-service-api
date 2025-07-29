import {
  ticketSchema,
  ticketEvidenceSchema,
  ticketPartChangeSchema,
  ticketSchemaCreate,
  ticketStatusSchema,
  ticketCloseSchema,
} from "../schemas/ticket.schema.js";
import { mediaUpload } from "../services/media.js";
import { sendTicketNotification } from "../services/email.js";
import { DELETE_STATUS, generateTicketPublicId } from "../utils/contanst.js";

// Obtener todos los tickets
export const getTickets = async (req, res) => {
  const { rows } = await req.exec(
    `
    SELECT t.*, 
           c.name as customer_name, 
           c.email as customer_email,
           c.phone as customer_phone,
           u.name as technician_name,
           u.email as technician_email
    FROM tickets t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.technician_id = u.id
    WHERE t.status != $1
    ORDER BY t.id DESC
  `,
    [DELETE_STATUS]
  );
  return res.resp(rows);
};

// Obtener un ticket específico con todas sus evidencias
export const getTicket = async (req, res) => {
  const { id } = req.params;

  // Obtener el ticket principal
  const { rows: ticketRows } = await req.exec(
    `
    SELECT t.* FROM tickets t WHERE t.id = $1
  `,
    [id]
  );

  if (!ticketRows.length) {
    throw "BE004";
  }

  const ticket = ticketRows[0];

  // Obtener información del customer
  if (ticket.customer_id) {
    const { rows: customerRows } = await req.exec(
      `SELECT name, last_name, email, phone FROM customers WHERE id = $1`,
      [ticket.customer_id]
    );
    if (customerRows.length) {
      ticket.customer = customerRows[0];
    }
  }

  // Obtener información del technician
  if (ticket.technician_id) {
    const { rows: technicianRows } = await req.exec(
      `SELECT name, email FROM users WHERE id = $1`,
      [ticket.technician_id]
    );
    if (technicianRows.length) {
      ticket.technician = technicianRows[0];
    }
  }

  // Obtener todas las evidencias del ticket
  const { rows: evidenceRows } = await req.exec(
    `
    SELECT te.*
    FROM ticket_evidences te
    WHERE te.ticket_id = $1 AND te.status != $2
    ORDER BY te.created_at ASC
  `,
    [id, DELETE_STATUS]
  );

  // Obtener los medios para cada evidencia
  for (let evidence of evidenceRows) {
    const { rows: mediaRows } = await req.exec(
      `
      SELECT * FROM ticket_evidence_media 
      WHERE evidence_id = $1
      ORDER BY created_at ASC
    `,
      [evidence.id]
    );
    evidence.media = mediaRows;
  }

  // Obtener cambios de piezas
  const { rows: partChanges } = await req.exec(
    `
    SELECT * FROM ticket_part_changes 
    WHERE ticket_id = $1
    ORDER BY created_at ASC
  `,
    [id]
  );

  ticket.evidences = evidenceRows;
  ticket.part_changes = partChanges;

  return res.resp(ticket);
};

// Crear un nuevo ticket con evidencia de recepción automática
export const createTicket = async (req, res) => {
  const { error } = ticketSchemaCreate.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE100";
  }

  const created_by = req.user.id;
  const {
    customer_id,
    technician_id,
    device_model,
    device_serial,
    description,
    amount,
    payment_method,
    payment_first_amount,
    payment_second_amount,
  } = req.body;

  // Verificar que el cliente existe y obtener sus datos
  const { rows: customerCheck } = await req.exec(
    `SELECT id, name, last_name, email FROM customers WHERE id = $1`,
    [customer_id]
  );

  if (!customerCheck.length) {
    throw "BE004"; // Cliente no encontrado
  }

  const customer = customerCheck[0];

  // Verificar que el técnico existe y tiene rol apropiado
  const { rows: technicianCheck } = await req.exec(
    `SELECT id FROM users WHERE id = $1 AND (role = 'support' OR role = 'admin' OR role = 'super_admin')`,
    [technician_id]
  );

  if (!technicianCheck.length) {
    throw "BE004"; // Técnico no encontrado o sin permisos
  }

  // Verificar que el usuario creador existe
  const { rows: creatorCheck } = await req.exec(
    `SELECT id FROM users WHERE id = $1`,
    [created_by]
  );
  if (!creatorCheck.length) {
    throw "BE004"; // Usuario creador no encontrado
  }

  // Iniciar transacción
  await req.exec("BEGIN");

  try {
    // Generar ID público único
    const public_id = generateTicketPublicId();

    // Crear el ticket
    const { rows: ticketRows } = await req.exec(
      `
      INSERT INTO tickets (public_id, customer_id, technician_id, device_model, device_serial, description, amount, payment_method, payment_first_amount, payment_second_amount, status, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *
    `,
      [
        public_id,
        customer_id,
        technician_id,
        device_model,
        device_serial,
        description,
        amount,
        payment_method,
        payment_first_amount,
        payment_second_amount,
        "open",
        created_by,
      ]
    );

    const ticket = ticketRows[0];

    await req.exec("COMMIT");

    // Enviar email de notificación al cliente
    try {
      const customerName = `${customer.name} ${customer.last_name}`.trim();
      await sendTicketNotification(customer.email, customerName, ticket);
      console.log(
        `Email de notificación enviado a ${customer.email} para el ticket ${ticket.public_id}`
      );
    } catch (emailError) {
      console.error("Error enviando email de notificación:", emailError);
      // No lanzamos el error para no afectar la creación del ticket
      // El ticket se creó exitosamente aunque el email falle
    }

    return res.resp(ticket);
  } catch (err) {
    await req.exec("ROLLBACK");
    throw err;
  }
};

// Actualizar un ticket
export const updateTicket = async (req, res) => {
  const { error } = ticketSchema.validate(req.body);
  if (error) {
    console.log("error", error);
    throw "BE100";
  }

  const { id } = req.params;
  const {
    customer_id,
    technician_id,
    device_model,
    device_serial,
    description,
    amount,
    payment_method,
    payment_first_amount,
    payment_second_amount,
    status,
    created_by,
  } = req.body;

  const { rows } = await req.exec(
    `
    UPDATE tickets 
    SET customer_id = $1, technician_id = $2, device_model = $3, device_serial = $4, description = $5, amount = $6, payment_method = $7, payment_first_amount = $8, payment_second_amount = $9, status = $10, created_by = $11, updated_at = NOW()
    WHERE id = $12 
    RETURNING *
  `,
    [
      customer_id,
      technician_id,
      device_model,
      device_serial,
      description,
      amount,
      payment_method,
      payment_first_amount,
      payment_second_amount,
      status,
      created_by,
      id,
    ]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};

export const changeTicketStatus = async (req, res) => {
  const { error } = ticketStatusSchema.validate(req.body);
  if (error) {
    throw "BE100";
  }

  const { id } = req.params;
  const { status } = req.body;

  const { rows } = await req.exec(
    `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};

export const closeTicket = async (req, res) => {
  const { id } = req.params;
  const { payment_second_amount } = req.body;

  // Obtener los datos del ticket para validar los pagos
  const { rows: ticketRows } = await req.exec(
    `SELECT amount, payment_first_amount FROM tickets WHERE id = $1`,
    [id]
  );

  if (!ticketRows.length) {
    throw "BE004";
  }

  const ticket = ticketRows[0];
  const totalAmount = parseFloat(ticket.amount);
  const firstPayment = parseFloat(ticket.payment_first_amount);
  const pendingAmount = totalAmount - firstPayment;

  // Si hay un monto pendiente, el segundo pago es obligatorio
  if (pendingAmount > 0) {
    if (
      !payment_second_amount ||
      parseFloat(payment_second_amount) !== pendingAmount
    ) {
      throw "BE106"; // Error: Se requiere el segundo pago por el monto pendiente
    }
  }

  // Validar con el schema
  const { error } = ticketCloseSchema.validate(req.body);
  if (error) {
    throw "BE100";
  }

  const { rows } = await req.exec(
    `UPDATE tickets SET status = $1, payment_second_amount = COALESCE($2, payment_second_amount), updated_at = NOW() WHERE id = $3 RETURNING *`,
    ["closed", payment_second_amount, id]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};

// Eliminar un ticket
export const deleteTicket = async (req, res) => {
  const { id } = req.params;

  const { rows } = await req.exec(
    `
    UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
  `,
    [DELETE_STATUS, id]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};

// Crear una nueva evidencia para un ticket
export const createTicketEvidence = async (req, res) => {
  // Para FormData, los campos vienen en req.body y los archivos en req.files
  const created_by = req.user.id;
  const { ticket_id, type, comment } = req.body;
  const uploadedFiles = req.files || [];

  // Convertir strings de FormData a números y preparar datos para validación
  const validationData = {
    ticket_id: parseInt(ticket_id),
    type,
    created_by: parseInt(created_by),
    comment,
  };

  // Validar usando el schema
  const { error } = ticketEvidenceSchema.validate(validationData);
  if (error) {
    console.log("error", error);
    throw "BE100"; // Error de validación
  }

  // Verificar que el ticket existe
  const { rows: ticketCheck } = await req.exec(
    `SELECT id, status FROM tickets WHERE id = $1`,
    [validationData.ticket_id]
  );

  if (!ticketCheck.length) {
    throw "BE004"; // Ticket no encontrado
  }

  // Verificar que el usuario existe
  const { rows: userCheck } = await req.exec(
    `SELECT id FROM users WHERE id = $1`,
    [validationData.created_by]
  );

  if (!userCheck.length) {
    throw "BE004"; // Usuario no encontrado
  }

  // Iniciar transacción
  await req.exec("BEGIN");

  try {
    // Crear la evidencia
    const { rows: evidenceRows } = await req.exec(
      `
      INSERT INTO ticket_evidences (ticket_id, type, created_by, comment) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `,
      [
        validationData.ticket_id,
        validationData.type,
        validationData.created_by,
        validationData.comment,
      ]
    );

    const evidence = evidenceRows[0];
    const failedUploads = [];

    // Procesar archivos subidos si los hay
    if (uploadedFiles.length > 0) {
      for (const uploadedFile of uploadedFiles) {
        try {
          // Subir archivo usando el servicio de media
          const uploadResult = await mediaUpload(uploadedFile);
          const mediaData = uploadResult.file;

          // Crear registro en ticket_evidence_media
          await req.exec(
            `
            INSERT INTO ticket_evidence_media (evidence_id, media_type, storage_id, url) 
            VALUES ($1, $2, $3, $4)
          `,
            [
              evidence.id,
              mediaData.type,
              mediaData.id, // storage_id del servicio de media
              mediaData.public_url, // URL del archivo subido
            ]
          );
        } catch (fileError) {
          console.error("Error procesando archivo:", fileError);
          failedUploads.push({
            filename: uploadedFile.originalname || uploadedFile.name,
            error: fileError.message,
          });
        }
      }
    }

    // Si la evidencia es de tipo 'delivery', automáticamente cambiar el estado del ticket a 'closed'
    if (validationData.type === "delivery") {
      await req.exec(
        `UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id = $1`,
        [validationData.ticket_id]
      );
    }

    await req.exec("COMMIT");

    // Agregar información sobre archivos fallidos si los hay
    const response = {
      ...evidence,
      uploaded_files_count: uploadedFiles.length - failedUploads.length,
      failed_uploads: failedUploads.length > 0 ? failedUploads : undefined,
    };

    return res.resp(response);
  } catch (err) {
    await req.exec("ROLLBACK");
    throw err;
  }
};

// Obtener evidencias de un ticket
export const getTicketEvidences = async (req, res) => {
  const { ticket_id } = req.params;

  const { rows } = await req.exec(
    `
    SELECT te.*, 
           u.name as user_name,
           u.email as user_email
    FROM ticket_evidences te
    LEFT JOIN users u ON te.created_by = u.id
    WHERE te.ticket_id = $1
    ORDER BY te.created_at ASC
  `,
    [ticket_id]
  );

  // Obtener los medios para cada evidencia
  for (let evidence of rows) {
    const { rows: mediaRows } = await req.exec(
      `
      SELECT * FROM ticket_evidence_media 
      WHERE evidence_id = $1
      ORDER BY created_at ASC
    `,
      [evidence.id]
    );
    evidence.media = mediaRows;
  }

  return res.resp(rows);
};

export const deleteTicketEvidence = async (req, res) => {
  const { id } = req.params;

  const { rows } = await req.exec(
    `UPDATE ticket_evidences SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [DELETE_STATUS, id]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};
// Crear un cambio de pieza
export const createPartChange = async (req, res) => {
  const { error } = ticketPartChangeSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const {
    ticket_id,
    removed_part_name,
    installed_part_name,
    removed_evidence_id,
    installed_evidence_id,
  } = req.body;

  const { rows } = await req.exec(
    `
    INSERT INTO ticket_part_changes (ticket_id, removed_part_name, installed_part_name, removed_evidence_id, installed_evidence_id) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *
  `,
    [
      ticket_id,
      removed_part_name,
      installed_part_name,
      removed_evidence_id,
      installed_evidence_id,
    ]
  );

  return res.resp(rows[0]);
};

// Obtener cambios de piezas de un ticket
export const getPartChanges = async (req, res) => {
  const { ticket_id } = req.params;

  const { rows } = await req.exec(
    `
    SELECT tpc.*,
           te_removed.comment as removed_comment,
           te_removed.created_at as removed_at,
           te_installed.comment as installed_comment,
           te_installed.created_at as installed_at
    FROM ticket_part_changes tpc
    LEFT JOIN ticket_evidences te_removed ON tpc.removed_evidence_id = te_removed.id
    LEFT JOIN ticket_evidences te_installed ON tpc.installed_evidence_id = te_installed.id
    WHERE tpc.ticket_id = $1
    ORDER BY tpc.created_at ASC
  `,
    [ticket_id]
  );

  return res.resp(rows);
};

// Obtener tickets por técnico
export const getTicketsByTechnician = async (req, res) => {
  const { technician_id } = req.params;

  const { rows } = await req.exec(
    `
    SELECT t.*, 
           c.name as customer_name, 
           c.email as customer_email,
           c.phone as customer_phone
    FROM tickets t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.technician_id = $1
    ORDER BY t.created_at DESC
  `,
    [technician_id]
  );

  return res.resp(rows);
};

// Obtener tickets por cliente
export const getTicketsByCustomer = async (req, res) => {
  const { customer_id } = req.params;

  const { rows } = await req.exec(
    `
    SELECT t.*, 
           u.name as technician_name,
           u.email as technician_email
    FROM tickets t
    LEFT JOIN users u ON t.technician_id = u.id
    WHERE t.customer_id = $1
    ORDER BY t.created_at DESC
  `,
    [customer_id]
  );

  return res.resp(rows);
};

// Obtener un ticket por su public_id
export const getTicketByPublicId = async (req, res) => {
  const { public_id } = req.params;

  // Obtener el ticket principal
  const { rows: ticketRows } = await req.exec(
    `
    SELECT t.* FROM tickets t WHERE t.public_id = $1
  `,
    [public_id]
  );

  if (!ticketRows.length) {
    throw "BE004";
  }

  const ticket = ticketRows[0];

  // Obtener información del customer
  if (ticket.customer_id) {
    const { rows: customerRows } = await req.exec(
      `SELECT name, last_name, email, phone FROM customers WHERE id = $1`,
      [ticket.customer_id]
    );
    if (customerRows.length) {
      ticket.customer = customerRows[0];
    }
  }

  // Obtener información del technician
  if (ticket.technician_id) {
    const { rows: technicianRows } = await req.exec(
      `SELECT name, email FROM users WHERE id = $1`,
      [ticket.technician_id]
    );
    if (technicianRows.length) {
      ticket.technician = technicianRows[0];
    }
  }

  // Obtener todas las evidencias del ticket
  const { rows: evidenceRows } = await req.exec(
    `
    SELECT te.*
    FROM ticket_evidences te
    WHERE te.ticket_id = $1 AND te.status != $2
    ORDER BY te.created_at ASC
  `,
    [ticket.id, DELETE_STATUS]
  );

  // Obtener los medios para cada evidencia
  for (let evidence of evidenceRows) {
    const { rows: mediaRows } = await req.exec(
      `
      SELECT * FROM ticket_evidence_media 
      WHERE evidence_id = $1
      ORDER BY created_at ASC
    `,
      [evidence.id]
    );
    evidence.media = mediaRows;
  }

  // Obtener cambios de piezas
  const { rows: partChanges } = await req.exec(
    `
    SELECT * FROM ticket_part_changes 
    WHERE ticket_id = $1
    ORDER BY created_at ASC
  `,
    [ticket.id]
  );

  ticket.evidences = evidenceRows;
  ticket.part_changes = partChanges;

  return res.resp(ticket);
};
