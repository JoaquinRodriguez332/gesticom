import express from "express"
import { query } from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Función para obtener fecha actual en formato YYYY-MM-DD
function getFechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

// GET /api/horarios/estado-colacion
router.get("/estado-colacion", authenticateToken, async (req, res) => {
  const usuario_id = req.user.id
  const fecha = getFechaHoy()

  try {
    const registro = await query(
      "SELECT hora_inicio_colacion, hora_fin_colacion FROM registros_horarios WHERE usuario_id = ? AND fecha = ?",
      [usuario_id, fecha],
    )

    if (registro.length === 0) {
      return res.json({
        en_colacion: false,
        mensaje: "No hay registro de horarios para hoy",
      })
    }

    const { hora_inicio_colacion, hora_fin_colacion } = registro[0]
    const en_colacion = hora_inicio_colacion && !hora_fin_colacion
    res.json({ en_colacion })
  } catch (error) {
    console.error("Error al obtener estado de colación:", error)
    res.status(500).json({ error: "Error al consultar el estado de colación" })
  }
})

// POST /api/horarios/marcar - VERSIÓN MEJORADA
router.post("/marcar", authenticateToken, async (req, res) => {
  const { tipo } = req.body
  const usuario_id = req.user.id
  const fecha = getFechaHoy()
  const camposValidos = ["entrada", "inicio_colacion", "fin_colacion", "salida"]

  console.log(`🔄 Intentando marcar ${tipo} para usuario ${usuario_id} en fecha ${fecha}`)

  if (!camposValidos.includes(tipo)) {
    console.log(`❌ Tipo inválido: ${tipo}`)
    return res.status(400).json({ error: "Tipo de marcación inválido" })
  }

  try {
    const campoHora = `hora_${tipo}`

    // 🔍 VERIFICAR SI YA EXISTE REGISTRO PARA HOY
    const registros = await query("SELECT * FROM registros_horarios WHERE usuario_id = ? AND fecha = ?", [
      usuario_id,
      fecha,
    ])

    if (registros.length > 0) {
      const registro = registros[0]

      // 🚫 VALIDACIÓN ESTRICTA: Si ya tiene valor, NO permitir cambio
      if (registro[campoHora] !== null && registro[campoHora] !== undefined) {
        console.log(`❌ ${tipo} ya registrada: ${registro[campoHora]}`)
        return res.status(409).json({
          error: `La ${tipo} ya fue registrada hoy a las ${registro[campoHora]}`,
          ya_marcado: true,
          hora_existente: registro[campoHora],
        })
      }

      // ✅ ACTUALIZAR SOLO SI EL CAMPO ESTÁ VACÍO
      console.log(`📝 Actualizando ${campoHora} para registro existente`)
      const resultado = await query(
        `UPDATE registros_horarios 
         SET ${campoHora} = CURRENT_TIME 
         WHERE usuario_id = ? AND fecha = ? AND ${campoHora} IS NULL`,
        [usuario_id, fecha],
      )

      // 🔍 VERIFICAR QUE LA ACTUALIZACIÓN FUE EXITOSA
      if (resultado.affectedRows === 0) {
        console.log(`❌ No se pudo actualizar - posiblemente ya estaba marcado`)
        return res.status(409).json({
          error: `La ${tipo} ya fue registrada previamente`,
          ya_marcado: true,
        })
      }
    } else {
      // 📝 CREAR NUEVO REGISTRO
      console.log(`📝 Creando nuevo registro para ${usuario_id}`)
      const campos = {
        hora_entrada: null,
        hora_inicio_colacion: null,
        hora_fin_colacion: null,
        hora_salida: null,
      }

      campos[campoHora] = new Date().toTimeString().slice(0, 8)

      await query(
        `INSERT INTO registros_horarios (usuario_id, fecha, hora_entrada, hora_inicio_colacion, hora_fin_colacion, hora_salida)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          usuario_id,
          fecha,
          campos.hora_entrada,
          campos.hora_inicio_colacion,
          campos.hora_fin_colacion,
          campos.hora_salida,
        ],
      )
    }

    // ✅ RESPUESTA EXITOSA
    console.log(`✅ ${tipo} registrada correctamente`)
    res.json({
      mensaje: `${tipo} registrada correctamente`,
      tipo: tipo,
      fecha: fecha,
      hora: new Date().toTimeString().slice(0, 8),
    })
  } catch (error) {
    console.error("❌ Error al registrar marcación:", error)
    res.status(500).json({ error: "Error interno al registrar horario" })
  }
})

// GET /api/horarios/mis-registros
router.get("/mis-registros", authenticateToken, async (req, res) => {
  const usuario_id = req.user.id

  try {
    const registros = await query(
      "SELECT * FROM registros_horarios WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 10",
      [usuario_id],
    )
    console.log(`📊 Enviando ${registros.length} registros para usuario ${usuario_id}`)
    res.json(registros)
  } catch (error) {
    console.error("Error al obtener registros:", error)
    res.status(500).json({ error: "Error al cargar registros" })
  }
})

export default router
