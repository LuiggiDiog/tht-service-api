import {
  ticketSchema,
  ticketEvidenceSchema,
  ticketPartChangeSchema,
} from "../schemas/ticket.schema.js";

// Obtener todos los tickets
export const getTickets = async (req, res) => {
  const { rows } = await req.exec(`
    SELECT t.*, 
           c.name as customer_name, 
           c.email as customer_email,
           c.phone as customer_phone,
           u.name as technician_name,
           u.email as technician_email
    FROM tickets t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.technician_id = u.id
    ORDER BY t.created_at DESC
  `);
  return res.resp(rows);
};

// Obtener un ticket específico con todas sus evidencias
export const getTicket = async (req, res) => {
  const { id } = req.params;

  // Obtener el ticket principal
  const { rows: ticketRows } = await req.exec(
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
    WHERE t.id = $1
  `,
    [id]
  );

  if (!ticketRows.length) {
    throw "BE004";
  }

  const ticket = ticketRows[0];

  // Obtener todas las evidencias del ticket
  const { rows: evidenceRows } = await req.exec(
    `
    SELECT te.*, 
           u.name as user_name,
           u.email as user_email
    FROM ticket_evidences te
    LEFT JOIN users u ON te.user_id = u.id
    WHERE te.ticket_id = $1
    ORDER BY te.created_at ASC
  `,
    [id]
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
  const { error } = ticketSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { customer_id, technician_id, status, description } = req.body;
  const userId = req.user?.id; // Usuario autenticado que crea el ticket

  // Verificar que el cliente existe
  const { rows: customerCheck } = await req.exec(
    `SELECT id FROM customers WHERE id = $1`,
    [customer_id]
  );

  if (!customerCheck.length) {
    throw "BE004"; // Cliente no encontrado
  }

  // Verificar que el técnico existe y tiene rol apropiado
  const { rows: technicianCheck } = await req.exec(
    `SELECT id FROM users WHERE id = $1 AND (role = 'support' OR role = 'admin' OR role = 'super_admin')`,
    [technician_id]
  );

  if (!technicianCheck.length) {
    throw "BE004"; // Técnico no encontrado o sin permisos
  }

  // Iniciar transacción
  await req.exec("BEGIN");

  try {
    // Crear el ticket
    const { rows: ticketRows } = await req.exec(
      `
      INSERT INTO tickets (customer_id, technician_id, status, description) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `,
      [customer_id, technician_id, status || "open", description]
    );

    const ticket = ticketRows[0];

    // Crear automáticamente la evidencia de recepción
    const { rows: evidenceRows } = await req.exec(
      `
      INSERT INTO ticket_evidences (ticket_id, type, user_id, comment) 
      VALUES ($1, 'reception', $2, 'Ticket recibido y registrado en el sistema') 
      RETURNING *
    `,
      [ticket.id, userId || technician_id]
    );

    await req.exec("COMMIT");

    // Retornar el ticket con la evidencia creada
    ticket.reception_evidence = evidenceRows[0];

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
    throw "BE005";
  }

  const { id } = req.params;
  const { customer_id, technician_id, status, description } = req.body;

  const { rows } = await req.exec(
    `
    UPDATE tickets 
    SET customer_id = $1, technician_id = $2, status = $3, description = $4, updated_at = NOW()
    WHERE id = $5 
    RETURNING *
  `,
    [customer_id, technician_id, status, description, id]
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
    DELETE FROM tickets WHERE id = $1 RETURNING *
  `,
    [id]
  );

  if (!rows.length) {
    throw "BE004";
  }

  return res.resp(rows[0]);
};

// Crear una nueva evidencia para un ticket
export const createTicketEvidence = async (req, res) => {
  const { error } = ticketEvidenceSchema.validate(req.body);
  if (error) {
    throw "BE005";
  }

  const { ticket_id, type, user_id, comment, media } = req.body;

  // Verificar que el ticket existe
  const { rows: ticketCheck } = await req.exec(
    `SELECT id, status FROM tickets WHERE id = $1`,
    [ticket_id]
  );

  if (!ticketCheck.length) {
    throw "BE004"; // Ticket no encontrado
  }

  // Verificar que el usuario existe
  const { rows: userCheck } = await req.exec(
    `SELECT id FROM users WHERE id = $1`,
    [user_id]
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
      INSERT INTO ticket_evidences (ticket_id, type, user_id, comment) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `,
      [ticket_id, type, user_id, comment]
    );

    const evidence = evidenceRows[0];

    // Si hay medios, crearlos
    if (media && media.length > 0) {
      for (const mediaItem of media) {
        await req.exec(
          `
          INSERT INTO ticket_evidence_media (evidence_id, media_type, storage_id, url) 
          VALUES ($1, $2, $3, $4)
        `,
          [
            evidence.id,
            mediaItem.media_type,
            mediaItem.storage_id,
            mediaItem.url,
          ]
        );
      }
    }

    // Si la evidencia es de tipo 'delivery', automáticamente cambiar el estado del ticket a 'closed'
    if (type === "delivery") {
      await req.exec(
        `UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id = $1`,
        [ticket_id]
      );
    }

    await req.exec("COMMIT");

    return res.resp(evidence);
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
    LEFT JOIN users u ON te.user_id = u.id
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
