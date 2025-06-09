-- Primero verificamos si el usuario existe
SELECT * FROM usuarios WHERE email = 'admin@gesticom.cl';

-- Actualizamos la contraseña con un hash bcrypt válido para 'admin123'
-- Este es un hash bcrypt real para la contraseña 'admin123'
UPDATE usuarios 
SET password = '$2b$10$3Iy9MfmAYeP1UlGUZUQnVeQQmVlLzOGkLp4TKRQOcieVtBqILrZ4e'
WHERE email = 'admin@gesticom.cl';

-- Verificamos que se haya actualizado
SELECT id, nombre, email, rol FROM usuarios WHERE email = 'admin@gesticom.cl';

-- También podemos crear un usuario administrador nuevo si el anterior no existe
INSERT INTO usuarios (nombre, rut, email, password, rol, activo)
SELECT 'Administrador', '11.111.111-1', 'admin@gesticom.cl', '$2b$10$3Iy9MfmAYeP1UlGUZUQnVeQQmVlLzOGkLp4TKRQOcieVtBqILrZ4e', 'dueño', TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@gesticom.cl');
