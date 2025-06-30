import express from "express"
import { query } from "../config/database.js"
import { authenticateToken, requireRole } from "../middleware/auth.js"

const router = express.Router()

// Función para obtener fecha actual en formato YYYY-MM-DD
function getFechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

// GET /api/horarios/estado-colacion - Verificar si el usuario está en colación
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

    // Si ha iniciado colación pero no la ha terminado, está en colación
    const en_colacion = hora_inicio_colacion && !hora_fin_colacion

    res.json({
      en_colacion,
      hora_inicio: hora_inicio_colacion,
      hora_fin: hora_fin_colacion,
      mensaje: en_colacion ? `En colación desde las ${hora_inicio_colacion}` : "Disponible para trabajar",
    })
  } catch (error) {
    console.error("❌ Error al verificar estado de colación:", error)
    res.status(500).json({ error: "Error al verificar estado de colación" })
  }
})

// POST /api/horarios/marcar
router.post("/marcar", authenticateToken, async (req, res) => {
  const { tipo } = req.body
  const usuario_id = req.user.id
  const fecha = getFechaHoy()

  const camposValidos = {
    entrada: "hora_entrada",
    salida: "hora_salida",
    inicio_colacion: "hora_inicio_colacion",
    fin_colacion: "hora_fin_colacion",
  }

  const campo = camposValidos[tipo]
  if (!campo) {
    return res.status(400).json({ error: "Tipo de acción no válido" })
  }

  try {
    const registros = await query("SELECT * FROM registros_horarios WHERE usuario_id = ? AND fecha = ?", [
      usuario_id,
      fecha,
    ])

    if (registros.length === 0) {
      // Crear nuevo registro
      await query(`INSERT INTO registros_horarios (usuario_id, fecha, ${campo}) VALUES (?, ?, CURTIME())`, [
        usuario_id,
        fecha,
      ])
    } else {
      // Actualizar campo en registro existente
      await query(`UPDATE registros_horarios SET ${campo} = CURTIME() WHERE usuario_id = ? AND fecha = ?`, [
        usuario_id,
        fecha,
      ])
    }

    res.status(200).json({ mensaje: `Marcado: ${tipo}` })
  } catch (error) {
    console.error("❌ Error al registrar horario:", error)
    res.status(500).json({ error: "Error en el registro de horario" })
  }
})

// GET /api/horarios/mis-registros
router.get("/mis-registros", authenticateToken, async (req, res) => {
  const usuario_id = req.user.id

  try {
    const registros = await query(
      "SELECT fecha, hora_entrada, hora_inicio_colacion, hora_fin_colacion, hora_salida FROM registros_horarios WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 30",
      [usuario_id],
    )
    res.json(registros)
  } catch (error) {
    console.error("❌ Error al obtener registros:", error)
    res.status(500).json({ error: "Error al obtener registros de horarios" })
  }
})

// GET /api/horarios/reportes - Solo para admins
router.get("/reportes", authenticateToken, requireRole("admin"), async (req, res) => {
  const { inicio, fin } = req.query

  if (!inicio || !fin) {
    return res.status(400).json({ error: "Fechas de inicio y fin son requeridas" })
  }

  try {
    // Obtener todos los usuarios
    const usuarios = await query("SELECT id, nombre, rut FROM usuarios WHERE estado = 'habilitado' ORDER BY nombre")

    const reportes = []

    for (const usuario of usuarios) {
      // Obtener registros del usuario en el rango de fechas
      const registros = await query(
        `SELECT fecha, hora_entrada, hora_inicio_colacion, hora_fin_colacion, hora_salida 
         FROM registros_horarios 
         WHERE usuario_id = ? AND fecha BETWEEN ? AND ? 
         ORDER BY fecha DESC`,
        [usuario.id, inicio, fin],
      )

      // Calcular estadísticas
      const registrosConEstado = registros.map((registro) => {
        let estado = "ausente"
        let horasTrabajadas = null

        if (registro.hora_entrada && registro.hora_salida) {
          estado = "completo"
          // Calcular horas trabajadas (simplificado)
          const entrada = new Date(`2000-01-01 ${registro.hora_entrada}`)
          const salida = new Date(`2000-01-01 ${registro.hora_salida}`)
          horasTrabajadas = Math.round(((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60)) * 10) / 10
        } else if (registro.hora_entrada || registro.hora_salida) {
          estado = "incompleto"
        }

        return {
          ...registro,
          estado,
          horas_trabajadas: horasTrabajadas,
        }
      })

      reportes.push({
        id: usuario.id,
        nombre: usuario.nombre,
        rut: usuario.rut,
        registros: registrosConEstado,
        estadisticas: {
          diasCompletos: registrosConEstado.filter((r) => r.estado === "completo").length,
          diasIncompletos: registrosConEstado.filter((r) => r.estado === "incompleto").length,
          ausencias: registrosConEstado.filter((r) => r.estado === "ausente").length,
          totalHoras: registrosConEstado.reduce((sum, r) => sum + (r.horas_trabajadas || 0), 0),
        },
      })
    }

    res.json(reportes)
  } catch (error) {
    console.error("❌ Error al generar reportes:", error)
    res.status(500).json({ error: "Error al generar reportes de horarios" })
  }
})

// GET /api/horarios/estadisticas - Estadísticas generales para dashboard
router.get("/estadisticas", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const hoy = getFechaHoy()

    // Usuarios que han marcado entrada hoy
    const entradaHoy = await query(
      "SELECT COUNT(*) as count FROM registros_horarios WHERE fecha = ? AND hora_entrada IS NOT NULL",
      [hoy],
    )

    // Total de usuarios activos
    const totalUsuarios = await query(
      "SELECT COUNT(*) as count FROM usuarios WHERE estado = 'habilitado' AND rol = 'trabajador'",
    )

    // Usuarios que han completado su jornada hoy
    const jornadaCompleta = await query(
      "SELECT COUNT(*) as count FROM registros_horarios WHERE fecha = ? AND hora_entrada IS NOT NULL AND hora_salida IS NOT NULL",
      [hoy],
    )

    // Promedio de horas trabajadas esta semana
    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
    const inicioSemanaStr = inicioSemana.toISOString().slice(0, 10)

    const horasSemana = await query(
      `SELECT AVG(
        CASE 
          WHEN hora_entrada IS NOT NULL AND hora_salida IS NOT NULL 
          THEN TIME_TO_SEC(TIMEDIFF(hora_salida, hora_entrada)) / 3600 
          ELSE NULL 
        END
      ) as promedio_horas
      FROM registros_horarios 
      WHERE fecha >= ?`,
      [inicioSemanaStr],
    )

    res.json({
      presentes_hoy: entradaHoy[0].count,
      total_usuarios: totalUsuarios[0].count,
      jornada_completa: jornadaCompleta[0].count,
      promedio_horas_semana: Math.round((horasSemana[0].promedio_horas || 0) * 10) / 10,
      fecha_consulta: hoy,
    })
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error al obtener estadísticas" })
  }
})

export default router
