import nodemailer from "nodemailer";
import {
  APP_URL_FRONT,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from "../config.js";

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Función para enviar email de notificación de ticket
export const sendTicketNotification = async (
  customerEmail,
  customerName,
  ticketData
) => {
  try {
    const ticketUrl = `${APP_URL_FRONT}/tickets-info/${ticketData.public_id}`;

    const mailOptions = {
      from: `"The House Technology - Servicio Técnico" <${SMTP_USER}>`,
      to: customerEmail,
      subject: `Nuevo ticket de servicio técnico - ${ticketData.public_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">¡Hola ${customerName}!</h2>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #007bff; margin-top: 0;">Se ha creado un nuevo ticket de servicio técnico</h3>
            
            <div style="margin: 20px 0;">
              <p><strong>Número de ticket:</strong> ${ticketData.public_id}</p>
              <p><strong>Dispositivo:</strong> ${ticketData.device_model}</p>
              <p><strong>Descripción:</strong> ${ticketData.description}</p>
              <p><strong>Estado:</strong> <span style="color: #28a745; font-weight: bold;">Abierto</span></p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #0056b3;">
                <strong>Importante:</strong> Puedes dar seguimiento a tu ticket usando el siguiente enlace:
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver mi ticket
              </a>
            </div>
            
            <div style="font-size: 14px; color: #6c757d; margin-top: 20px;">
              <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                ${ticketUrl}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #6c757d;">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes alguna pregunta, contacta directamente con nuestro servicio técnico.</p>
          </div>
        </div>
      `,
      text: `
        Hola ${customerName},
        
        Se ha creado un nuevo ticket de servicio técnico con los siguientes detalles:
        
        Número de ticket: ${ticketData.public_id}
        Dispositivo: ${ticketData.device_model}
        Descripción: ${ticketData.description}
        Estado: Abierto
        
        Para dar seguimiento a tu ticket, visita: ${ticketUrl}
        
        Este es un email automático, por favor no respondas a este mensaje.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error enviando email:", error);
    throw new Error("Error al enviar email de notificación");
  }
};

// Función para verificar la configuración del email
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("Configuración de email verificada correctamente");
    return true;
  } catch (error) {
    console.error("Error verificando configuración de email:", error);
    return false;
  }
};
