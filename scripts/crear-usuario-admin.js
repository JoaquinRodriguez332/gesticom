import bcrypt from "bcrypt"

// Función para hashear contraseña
async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Crear usuario con contraseña hasheada
async function crearUsuario() {
  const password = "12345678"
  const hashedPassword = await hashPassword(password)

  console.log("Usuario: Joaquín Rodríguez")
  console.log("Email: joaco@example.com")
  console.log("Contraseña original:", password)
  console.log("Contraseña hasheada:", hashedPassword)
  console.log("\nSQL para insertar:")
  console.log(`INSERT INTO usuarios (nombre, rut, email, password, rol, activo) 
VALUES ('Joaquín Rodríguez', '12.345.678-9', 'joaco@example.com', '${hashedPassword}', 'dueño', TRUE);`)
}

crearUsuario()
