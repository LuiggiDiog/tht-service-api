import dotenv from "dotenv";
import {
  sendTicketNotification,
  verifyEmailConfig,
} from "../services/email.js";

// Cargar variables de entorno
dotenv.config();

const testEmail = async () => {
  try {
    console.log("🔍 Verificando configuración de email...");

    // Verificar configuración
    const isConfigValid = await verifyEmailConfig();

    if (!isConfigValid) {
      console.error("❌ Error en la configuración de email");
      console.log("Por favor, verifica las variables de entorno:");
      console.log("- SMTP_HOST:", process.env.SMTP_HOST);
      console.log("- SMTP_PORT:", process.env.SMTP_PORT);
      console.log("- SMTP_USER:", process.env.SMTP_USER);
      console.log(
        "- SMTP_PASS:",
        process.env.SMTP_PASS ? "Configurada" : "No configurada"
      );
      return;
    }

    console.log("✅ Configuración de email válida");

    // Datos de prueba
    const testTicket = {
      public_id: "TKT-TEST-123456",
      device_model: "iPhone 12",
      description: "Pantalla rota, necesita reemplazo",
    };

    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    const testName = "Cliente de Prueba";

    console.log("📧 Enviando email de prueba...");
    console.log("Destinatario:", testEmail);

    await sendTicketNotification(testEmail, testName, testTicket);

    console.log("✅ Email de prueba enviado exitosamente");
    console.log("Revisa la bandeja de entrada de:", testEmail);
  } catch (error) {
    console.error("❌ Error en la prueba de email:", error.message);
    console.log("Verifica la configuración en EMAIL_CONFIG.md");
  }
};

// Ejecutar la prueba
testEmail();
