import express from "express"
import { query, queryOne } from "../config/database.js"
import { hashPassword, validateRUT, validatePassword, authenticateToken, requireRole } from "../middleware/auth.js"

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
    // No fallar la operación por un error de log
  }
}

// GET /api/usuarios - Obtener todos los usuarios (solo dueños)
router.get("/", authenticateToken, requireRole("dueño"), async (req, res) => {
  try {
    const { search, rol, activo } = req.query

    let sql = `
      SELECT 
        id, nombre, rut, correo as email, rol, 
        CASE WHEN estado = 'habilitado' THEN true ELSE false END as activo,
        fecha_creacion, fecha_creacion as ultimo_acceso
      FROM usuarios 
      WHERE 1=1
    `
    const params = []

    if (search) {
      sql += " AND (nombre LIKE ? OR rut LIKE ? OR correo LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (rol) {
      sql += " AND rol = ?"
      params.push(rol)
    }

    if (activo !== undefined) {
      const estadoFiltro = activo === "true" ? "habilitado" : "deshabilitado"
      sql += " AND estado = ?"
      params.push(estadoFiltro)
    }

    sql += " ORDER BY fecha_creacion DESC"

    const usuarios = await query(sql, params)
    res.json(usuarios)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET /api/usuarios/:id - Obtener usuario por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Solo dueños pueden ver otros usuarios, trabajadores solo su propio perfil
    if (req.user.rol !== "dueño" && req.user.id !== Number.parseInt(id)) {
      return res.status(403).json({ error: "No tienes permisos para ver este usuario" })
    }

    const usuario = await queryOne(
      `SELECT 
        id, nombre, rut, correo as email, rol,
        CASE WHEN estado = 'habilitado' THEN true ELSE false END as activo,
        fecha_creacion, fecha_creacion as ultimo_acceso
      FROM usuarios 
      WHERE id = ?`,
      [id],
    )

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json(usuario)
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// POST /api/usuarios - Crear nuevo usuario (solo dueños)
router.post("/", authenticateToken, requireRole("dueño"), async (req, res) => {
  try {
    const { nombre, rut, email, password, rol } = req.body

    // Validaciones
    if (!nombre || !rut || !email || !password || !rol) {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    if (!validateRUT(rut)) {
      return res.status(400).json({ error: "RUT inválido" })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "La contraseña no cumple los requisitos",
        details: passwordValidation.errors,
      })
    }

    if (!["dueño", "trabajador"].includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" })
    }

    // Verificar que RUT y email no existan
    const existingUser = await queryOne("SELECT id FROM usuarios WHERE rut = ? OR correo = ?", [rut, email])

    if (existingUser) {
      return res.status(400).json({ error: "RUT o email ya están registrados" })
    }

    // Crear usuario
    const hashedPassword = await hashPassword(password)
    const result = await query(
      `INSERT INTO usuarios (nombre, rut, correo, contrasena, rol, estado) 
       VALUES (?, ?, ?, ?, ?, 'habilitado')`,
      [nombre, rut, email, hashedPassword, rol],
    )

    // Obtener usuario creado
    const newUser = await queryOne(
      `SELECT 
        id, nombre, rut, correo as email, rol,
        CASE WHEN estado = 'habilitado' THEN true ELSE false END as activo,
        fecha_creacion
      FROM usuarios 
      WHERE id = ?`,
      [result.insertId],
    )

    // Log de actividad (opcional)
    await logActivity(req.user.id, "CREATE_USER", `Usuario creado: ${nombre} (${rut})`, req.ip)

    res.status(201).json(newUser)
  } catch (error) {
    console.error("Error al crear usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// PUT /api/usuarios/:id - Actualizar usuario
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, email, rol } = req.body

    // Solo dueños pueden editar otros usuarios, trabajadores solo su propio perfil
    if (req.user.rol !== "dueño" && req.user.id !== Number.parseInt(id)) {
      return res.status(403).json({ error: "No tienes permisos para editar este usuario" })
    }

    // Trabajadores no pueden cambiar su rol
    if (req.user.rol === "trabajador" && rol && rol !== req.user.rol) {
      return res.status(403).json({ error: "No puedes cambiar tu propio rol" })
    }

    // Validaciones
    if (!nombre || !email) {
      return res.status(400).json({ error: "Nombre y email son requeridos" })
    }

    // Verificar que el usuario existe
    const existingUser = await queryOne("SELECT id, rut FROM usuarios WHERE id = ?", [id])
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Verificar que el email no esté en uso por otro usuario
    const emailInUse = await queryOne("SELECT id FROM usuarios WHERE correo = ? AND id != ?", [email, id])

    if (emailInUse) {
      return res.status(400).json({ error: "El email ya está en uso" })
    }

    // Construir query de actualización
    const updateFields = ["nombre = ?", "correo = ?"]
    const updateValues = [nombre, email]

    if (rol && req.user.rol === "dueño") {
      updateFields.push("rol = ?")
      updateValues.push(rol)
    }

    updateValues.push(id)

    await query(`UPDATE usuarios SET ${updateFields.join(", ")} WHERE id = ?`, updateValues)

    // Obtener usuario actualizado
    const updatedUser = await queryOne(
      `SELECT 
        id, nombre, rut, correo as email, rol,
        CASE WHEN estado = 'habilitado' THEN true ELSE false END as activo,
        fecha_creacion
      FROM usuarios 
      WHERE id = ?`,
      [id],
    )

    // Log de actividad (opcional)
    await logActivity(
      req.user.id,
      "UPDATE_USER",
      `Usuario actualizado: ${updatedUser.nombre} (${updatedUser.rut})`,
      req.ip,
    )

    res.json(updatedUser)
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// PUT /api/usuarios/:id/toggle-status - Activar/Desactivar usuario (solo dueños)
router.put("/:id/toggle-status", authenticateToken, requireRole("dueño"), async (req, res) => {
  try {
    const { id } = req.params

    // No permitir desactivar el propio usuario
    if (req.user.id === Number.parseInt(id)) {
      return res.status(400).json({ error: "No puedes desactivar tu propia cuenta" })
    }

    const usuario = await queryOne("SELECT id, nombre, rut, estado FROM usuarios WHERE id = ?", [id])
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    const newStatus = usuario.estado === "habilitado" ? "deshabilitado" : "habilitado"
    await query("UPDATE usuarios SET estado = ? WHERE id = ?", [newStatus, id])

    // Log de actividad (opcional)
    const accion = newStatus === "habilitado" ? "ACTIVATE_USER" : "DEACTIVATE_USER"
    const descripcion = `Usuario ${newStatus === "habilitado" ? "activado" : "desactivado"}: ${usuario.nombre} (${usuario.rut})`

    await logActivity(req.user.id, accion, descripcion, req.ip)

    res.json({
      message: `Usuario ${newStatus === "habilitado" ? "activado" : "desactivado"} exitosamente`,
      activo: newStatus === "habilitado",
    })
  } catch (error) {
    console.error("Error al cambiar estado del usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// DELETE /api/usuarios/:id - Eliminar usuario (solo dueños)
router.delete("/:id", authenticateToken, requireRole("dueño"), async (req, res) => {
  try {
    const { id } = req.params

    // No permitir eliminar el propio usuario
    if (req.user.id === Number.parseInt(id)) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" })
    }

    const usuario = await queryOne("SELECT nombre, rut FROM usuarios WHERE id = ?", [id])
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    await query("DELETE FROM usuarios WHERE id = ?", [id])

    // Log de actividad (opcional)
    await logActivity(req.user.id, "DELETE_USER", `Usuario eliminado: ${usuario.nombre} (${usuario.rut})`, req.ip)

    res.json({ message: "Usuario eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

export default router
