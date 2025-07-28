import { connection } from "../connection.js";
import { generateTicketPublicId } from "../utils/contanst.js";

const migrateTicketPublicIds = async () => {
  try {
    console.log("Iniciando migración de public_ids para tickets...");

    // Verificar si la columna public_id existe
    const { rows: columnCheck } = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name = 'public_id'
    `);

    if (columnCheck.length === 0) {
      console.log("Agregando columna public_id a la tabla tickets...");
      await connection.query(`
        ALTER TABLE tickets 
        ADD COLUMN public_id VARCHAR(50) UNIQUE
      `);
    }

    // Obtener todos los tickets que no tienen public_id
    const { rows: ticketsWithoutPublicId } = await connection.query(`
      SELECT id FROM tickets WHERE public_id IS NULL
    `);

    console.log(
      `Encontrados ${ticketsWithoutPublicId.length} tickets sin public_id`
    );

    // Generar public_id para cada ticket
    for (const ticket of ticketsWithoutPublicId) {
      let public_id;
      let isUnique = false;

      // Generar public_id único
      while (!isUnique) {
        public_id = generateTicketPublicId();

        const { rows: existingCheck } = await connection.query(
          `
          SELECT id FROM tickets WHERE public_id = $1
        `,
          [public_id]
        );

        if (existingCheck.length === 0) {
          isUnique = true;
        }
      }

      // Actualizar el ticket con el public_id
      await connection.query(
        `
        UPDATE tickets SET public_id = $1 WHERE id = $2
      `,
        [public_id, ticket.id]
      );

      console.log(
        `Ticket ${ticket.id} actualizado con public_id: ${public_id}`
      );
    }

    // Hacer la columna NOT NULL después de migrar todos los datos
    await connection.query(`
      ALTER TABLE tickets ALTER COLUMN public_id SET NOT NULL
    `);

    console.log("Migración completada exitosamente!");
  } catch (error) {
    console.error("Error durante la migración:", error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Ejecutar la migración si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTicketPublicIds();
}

export default migrateTicketPublicIds;
