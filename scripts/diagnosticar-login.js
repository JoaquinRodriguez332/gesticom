// Script para diagnosticar problemas de login
import mysql from "mysql2/promise"
import bcrypt from "bcrypt"

const config = {
  host: "localhost",
  user: "root",
  password: "", // Ajusta según tu configuración
  database: "gesticom",
}

async function diagnosticarLogin() {
  let connection

  try {
    console.log("🔍 Iniciando diagnóstico de login...\n")

    // Conectar a la base de datos
    connection = await mysql.createConnection(config)
    console.log("✅ Conexión a base de datos exitosa")

    // 1. Verificar estructura de la tabla usuarios
    console.log("\n📋 Verificando estructura de tabla usuarios:")
    const [columns] = await connection.execute("DESCRIBE usuarios")
    columns.forEach((col) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === "NO" ? "(NOT NULL)" : ""}`)
    })

    // 2. Buscar el usuario admin
    console.log("\n👤 Buscando usuario admin:")
    const [users] = await connection.execute(
      "SELECT id, nombre, rut, correo, rol, estado, LENGTH(contrasena) as password_length FROM usuarios WHERE correo = ?",
      ["admin@gesticom.cl"],
    )

    if (users.length === 0) {
      console.log("❌ Usuario admin NO encontrado")

      // Crear usuario admin
      console.log("\n🔧 Creando usuario admin...")
      const hashedPassword = await bcrypt.hash("admin123", 10)

      await connection.execute(
        "INSERT INTO usuarios (nombre, rut, correo, contrasena, rol, estado) VALUES (?, ?, ?, ?, ?, ?)",
        ["Administrador", "11.111.111-1", "admin@gesticom.cl", hashedPassword, "dueño", "habilitado"],
      )

      console.log("✅ Usuario admin creado exitosamente")

      // Verificar creación
      const [newUsers] = await connection.execute(
        "SELECT id, nombre, rut, correo, rol, estado FROM usuarios WHERE correo = ?",
        ["admin@gesticom.cl"],
      )
      console.log("📄 Usuario creado:", newUsers[0])
    } else {
      console.log("✅ Usuario admin encontrado:")
      console.log("📄 Datos:", users[0])

      // 3. Verificar contraseña
      console.log("\n🔐 Verificando contraseña...")
      const [fullUser] = await connection.execute("SELECT contrasena FROM usuarios WHERE correo = ?", [
        "admin@gesticom.cl",
      ])

      const passwordMatch = await bcrypt.compare("admin123", fullUser[0].contrasena)
      console.log(`🔍 Contraseña 'admin123' ${passwordMatch ? "✅ VÁLIDA" : "❌ INVÁLIDA"}`)

      if (!passwordMatch) {
        console.log("\n🔧 Actualizando contraseña...")
        const hashedPassword = await bcrypt.hash("admin123", 10)

        await connection.execute("UPDATE usuarios SET contrasena = ? WHERE correo = ?", [
          hashedPassword,
          "admin@gesticom.cl",
        ])

        console.log("✅ Contraseña actualizada")
      }
    }

    // 4. Verificar todos los usuarios
    console.log("\n👥 Todos los usuarios en la base de datos:")
    const [allUsers] = await connection.execute("SELECT id, nombre, rut, correo, rol, estado FROM usuarios")
    allUsers.forEach((user) => {
      console.log(`  - ${user.nombre} (${user.correo}) - Rol: ${user.rol} - Estado: ${user.estado}`)
    })

    console.log("\n✅ Diagnóstico completado")
    console.log("\n🚀 Credenciales para login:")
    console.log("   Email: admin@gesticom.cl")
    console.log("   Contraseña: admin123")
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Ejecutar diagnóstico
diagnosticarLogin()
