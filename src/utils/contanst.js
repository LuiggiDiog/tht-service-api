export const ACTIVE_STATUS = "active";
export const NEXT_AVAILABLE_STATUS = "next-available";
export const INACTIVE_STATUS = "inactive";
export const DELETE_STATUS = "deleted";

// Función para generar ID público único para tickets
export const generateTicketPublicId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};
