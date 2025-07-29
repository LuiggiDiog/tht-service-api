# Configuración de Email para Notificaciones de Tickets

## Variables de Entorno Requeridas

Para que el sistema de notificaciones por email funcione correctamente, necesitas configurar las siguientes variables de entorno en tu archivo `.env`:

```env
# Configuración de Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion

# URL del Frontend (ya debe estar configurada)
APP_URL_FRONT=http://localhost:5173
```

## Configuración para Gmail

Si usas Gmail como proveedor de email:

1. **Habilitar la verificación en dos pasos** en tu cuenta de Google
2. **Generar una contraseña de aplicación**:
   - Ve a la configuración de tu cuenta de Google
   - Seguridad > Verificación en dos pasos
   - Contraseñas de aplicación
   - Genera una nueva contraseña para "Correo"
3. **Usa esa contraseña** en la variable `SMTP_PASS`

## Configuración para otros proveedores

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Servidor SMTP propio

```env
SMTP_HOST=tu-servidor-smtp.com
SMTP_PORT=587
```

## Funcionalidad

Una vez configurado, el sistema:

1. **Enviará automáticamente** un email al cliente cuando se cree un nuevo ticket
2. **Incluirá un enlace** para que el cliente pueda dar seguimiento a su ticket
3. **El enlace tendrá el formato**: `{APP_URL_FRONT}/tickets-info/{public_id}`
4. **Ejemplo**: `http://localhost:5173/tickets-info/TKT-MDNE0OQO-8TWYIT`

## Plantilla del Email

El email incluye:

- Saludo personalizado con el nombre del cliente
- Detalles del ticket (número, dispositivo, descripción)
- Enlace directo para dar seguimiento
- Versión en texto plano para compatibilidad

## Manejo de Errores

- Si el email falla, **el ticket se crea normalmente**
- Los errores de email se registran en la consola pero no afectan la operación
- Esto asegura que la funcionalidad principal no se vea afectada por problemas de email
