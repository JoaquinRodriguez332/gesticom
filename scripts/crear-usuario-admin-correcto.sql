-- Crear usuario administrador con la estructura correcta de tu base de datos
-- Primero verificamos si existe
SELECT * FROM usuarios WHERE correo = 'admin@gesticom.cl';

-- Si no existe, lo creamos con contraseña hasheada para 'admin123'
INSERT INTO usuarios (nombre, rut, correo, contrasena, rol, estado)
SELECT 'Administrador', '11.111.111-1', 'admin@gesticom.cl', '$2b$10$3Iy9MfmAYeP1UlGUZUQnVeQQmVlLzOGkLp4TKRQOcieVtBqILrZ4e', 'dueño', 'habilitado'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'admin@gesticom.cl');

-- Si ya existe, actualizamos la contraseña
UPDATE usuarios 
SET contrasena = '$2b$10$3Iy9MfmAYeP1UlGUZUQnVeQQmVlLzOGkLp4TKRQOcieVtBqILrZ4e',
    estado = 'habilitado'
WHERE correo = 'admin@gesticom.cl';

-- Verificamos el resultado
SELECT id, nombre, rut, correo, rol, estado FROM usuarios WHERE correo = 'admin@gesticom.cl';
