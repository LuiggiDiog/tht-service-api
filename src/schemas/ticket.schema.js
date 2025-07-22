import Joi from "joi";

export const ticketSchema = Joi.object({
  customer_id: Joi.number().required(),
  technician_id: Joi.number().required(),
  status: Joi.string().valid("open", "in_progress", "closed").default("open"),
  description: Joi.string().optional(),
});

export const ticketEvidenceSchema = Joi.object({
  ticket_id: Joi.number().required(),
  type: Joi.string()
    .valid("reception", "part_removed", "part_installed", "delivery")
    .required(),
  user_id: Joi.number().required(),
  comment: Joi.string().optional(),
  media: Joi.array()
    .items(
      Joi.object({
        media_type: Joi.string().valid("image", "video").required(),
        storage_id: Joi.string().required(),
        url: Joi.string().required(),
      })
    )
    .optional(),
});

export const ticketPartChangeSchema = Joi.object({
  ticket_id: Joi.number().required(),
  removed_part_name: Joi.string().required(),
  installed_part_name: Joi.string().required(),
  removed_evidence_id: Joi.number().required(),
  installed_evidence_id: Joi.number().required(),
});
