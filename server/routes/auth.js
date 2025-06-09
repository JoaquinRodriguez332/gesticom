import express from "express"
import { query, queryOne } from "../config/database.js"
import {
  generateToken,
  hashPassword,
  comparePassword,
  validatePassword,
  authenticateToken,
} from "../middleware/auth.js"

const router = express.Router()

// Función helper para logs (con manejo de errores)
const logActivity = async (userId, action, description, ipAddress) => {
  try {
    await query("INSERT INTO logs_actividad (usuario_id, accion, descripcion, ip_address) VALUES (?, ?, ?, ?)", [
      userId,
      action,
      description,
      ipAddress,
    ])
  } catch (error) {
    console.warn("⚠️ No se pudo registrar log de actividad:", error.message)
    // No fallar el login por un error de log
  }
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" })
    }

    // Buscar usuario por correo (no email)
    const usuario = await queryOne(
      "SELECT id, nombre, rut, correo, contrasena, rol, estado FROM usuarios WHERE correo = ?",
      [email],
    )

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    if (usuario.estado !== "habilitado") {
      return res.status(401).json({
        error: "Tu cuenta está deshabilitada. Contacta al administrador.",
      })
    }

    // Verificar contraseña
    const passwordValid = await comparePassword(password, usuario.contrasena)
    if (!passwordValid) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    // Generar token
    const token = generateToken(usuario.id, usuario.rol)

    // Log de actividad (opcional)
    await logActivity(usuario.id, "LOGIN", "Inicio de sesión exitoso", req.ip)

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rut: usuario.rut,
        email: usuario.correo, // Mapear correo a email para el frontend
        rol: usuario.rol,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log de actividad (opcional)
    await logActivity(req.user.id, "LOGOUT", "Cierre de sesión", req.ip)

    res.json({ message: "Sesión cerrada exitosamente" })
  } catch (error) {
    console.error("Error en logout:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const usuario = await queryOne(
      "SELECT id, nombre, rut, correo, rol, estado, fecha_creacion FROM usuarios WHERE id = ?",
      [req.user.id],
    )

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({
      ...usuario,
      email: usuario.correo, // Mapear para el frontend
      activo: usuario.estado === "habilitado", // Mapear para el frontend
    })
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// PUT /api/auth/change-password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Contraseña actual y nueva son requeridas" })
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "La nueva contraseña no cumple los requisitos",
        details: passwordValidation.errors,
      })
    }

    // Verificar contraseña actual
    const usuario = await queryOne("SELECT contrasena FROM usuarios WHERE id = ?", [req.user.id])

    const currentPasswordValid = await comparePassword(currentPassword, usuario.contrasena)
    if (!currentPasswordValid) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" })
    }

    // Actualizar contraseña
    const hashedNewPassword = await hashPassword(newPassword)
    await query("UPDATE usuarios SET contrasena = ? WHERE id = ?", [hashedNewPassword, req.user.id])

    // Log de actividad (opcional)
    await logActivity(req.user.id, "CHANGE_PASSWORD", "Cambio de contraseña", req.ip)

    res.json({ message: "Contraseña actualizada exitosamente" })
  } catch (error) {
    console.error("Error al cambiar contraseña:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

export default router
