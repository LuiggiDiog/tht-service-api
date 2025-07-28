# Sistema de IDs Públicos para Tickets

## Descripción

Se ha implementado un sistema de IDs públicos no secuenciales para los tickets, proporcionando mayor seguridad al compartir enlaces con información de tickets.

## Características

- **ID Público Único**: Cada ticket tiene un `public_id` generado automáticamente
- **Formato**: `TKT-{timestamp}-{random}` (ejemplo: `TKT-LM2N9X-ABC123`)
- **No Secuencial**: Los IDs no siguen un patrón secuencial para mayor seguridad
- **Acceso Público**: Los tickets pueden ser consultados sin autenticación usando el `public_id`

## Implementación

### 1. Base de Datos

Se agregó la columna `public_id` a la tabla `tickets`:

```sql
ALTER TABLE tickets ADD COLUMN public_id VARCHAR(50) UNIQUE NOT NULL;
```

### 2. Generación de IDs

Los IDs se generan usando la función `generateTicketPublicId()` que combina:

- Timestamp actual en base 36
- String aleatorio de 6 caracteres
- Prefijo "TKT-"

### 3. Endpoints

#### Crear Ticket (con autenticación)

```
POST /tickets
```

Genera automáticamente el `public_id` al crear un ticket.

#### Consultar Ticket por ID Interno (con autenticación)

```
GET /tickets/:id
```

#### Consultar Ticket por ID Público (sin autenticación)

```
GET /tickets-public/:public_id
```

## Migración de Datos Existentes

Para migrar tickets existentes que no tienen `public_id`:

```bash
npm run migrate:tickets
```

Este script:

1. Verifica si la columna `public_id` existe
2. La agrega si no existe
3. Genera IDs únicos para todos los tickets existentes
4. Hace la columna NOT NULL

## Uso

### Para Compartir Tickets

Cuando necesites compartir información de un ticket:

1. **Obtén el public_id** del ticket desde la base de datos o API
2. **Comparte el enlace**: `https://tu-dominio.com/tickets-public/TKT-LM2N9X-ABC123`
3. **El receptor** puede acceder sin necesidad de autenticación

### Ejemplo de Respuesta

```json
{
  "success": true,
  "data": {
    "id": 123,
    "public_id": "TKT-LM2N9X-ABC123",
    "customer_id": 456,
    "technician_id": 789,
    "device_model": "iPhone 12",
    "device_serial": "ABC123456789",
    "description": "Pantalla rota",
    "amount": 150.00,
    "status": "in_progress",
    "customer": {
      "name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "phone": "1234567890"
    },
    "technician": {
      "name": "María",
      "email": "maria@example.com"
    },
    "evidences": [...],
    "part_changes": [...]
  }
}
```

## Seguridad

- Los `public_id` son únicos y no secuenciales
- No contienen información sensible del ticket
- Solo permiten lectura, no modificación
- Pueden ser invalidados cambiando el `public_id` en la base de datos

## Notas Técnicas

- Los IDs se generan automáticamente al crear tickets
- La migración es segura y puede ejecutarse múltiples veces
- El endpoint público no requiere autenticación
- Se mantiene compatibilidad con el sistema existente
