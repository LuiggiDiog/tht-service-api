import Joi from "joi";

export const ticketSchema = Joi.object({
  id: Joi.number().required(),
  public_id: Joi.string().required(),
  customer_id: Joi.number().integer().required(),
  technician_id: Joi.number().integer().optional(), // TEMPORAL: Ahora es opcional
  device_model: Joi.string().required(),
  device_serial: Joi.string().required(),
  description: Joi.string().optional(),
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().required(),
  payment_first_amount: Joi.number().min(0).required(),
  payment_second_amount: Joi.number().min(0).required(),
  status: Joi.string().valid("open", "in_progress", "closed").default("open"),
  created_by: Joi.number().required(),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
});

export const ticketSchemaCreate = Joi.object({
  id: Joi.number().allow(null).optional(),
  customer_id: Joi.number().integer().required(),
  technician_id: Joi.number().integer().optional(), // TEMPORAL: Ahora es opcional
  device_model: Joi.string().required(),
  device_serial: Joi.string().required(),
  description: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().required(),
  payment_first_amount: Joi.number().min(0).required(),
  payment_second_amount: Joi.number().min(0).optional(),
  status: Joi.string().optional(),

  evidence_type: Joi.string().optional(),
  evidence_comment: Joi.string().optional(),
});

export const ticketStatusSchema = Joi.object({
  status: Joi.string().valid("open", "in_progress", "closed").required(),
});

export const ticketCloseSchema = Joi.object({
  payment_second_amount: Joi.number().min(0).optional(),
});

export const ticketEvidenceSchema = Joi.object({
  ticket_id: Joi.number().required(),
  type: Joi.string().required(),
  created_by: Joi.number().required(),
  comment: Joi.string().optional(),
  status: Joi.string().default("active"),
});

export const ticketPartChangeSchema = Joi.object({
  ticket_id: Joi.number().required(),
  removed_part_name: Joi.string().required(),
  installed_part_name: Joi.string().required(),
  removed_evidence_id: Joi.number().required(),
  installed_evidence_id: Joi.number().required(),
});
