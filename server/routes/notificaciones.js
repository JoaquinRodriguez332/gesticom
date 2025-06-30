import express from "express"
import { query } from "../config/database.js"
import { authenticateToken, requireRole } from "../middleware/auth.js"

const router = express.Router()

// GET /api/notificaciones - Obtener todas las notificaciones activas
router.get("/", authenticateToken, async (req, res) => {
  try {
    const notificaciones = await query(`
      SELECT 
        n.*,
        p.nombre as producto_nombre,
        p.stock as stock_actual,
        u.nombre as usuario_nombre
      FROM notificaciones n
      LEFT JOIN productos p ON n.producto_id = p.id
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.estado = 'activa'
      ORDER BY n.fecha DESC
    `)

    res.json(notificaciones)
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error)
    res.status(500).json({ error: "Error al obtener notificaciones" })
  }
})

// GET /api/notificaciones/stock-bajo - Verificar productos con stock bajo
router.get("/stock-bajo", authenticateToken, async (req, res) => {
  try {
    const productosStockBajo = await query(`
      SELECT 
        p.*,
        COALESCE(c.umbral_minimo, 5) as umbral_minimo
      FROM productos p
      LEFT JOIN configuracion_stock c ON p.id = c.producto_id
      WHERE p.stock <= COALESCE(c.umbral_minimo, 5)
      ORDER BY p.stock ASC
    `)

    res.json(productosStockBajo)
  } catch (error) {
    console.error("❌ Error al verificar stock bajo:", error)
    res.status(500).json({ error: "Error al verificar stock bajo" })
  }
})

// POST /api/notificaciones/generar-alertas - Generar alertas automáticas
router.post("/generar-alertas", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    // Obtener productos con stock bajo
    const productosStockBajo = await query(`
      SELECT 
        p.*,
        COALESCE(c.umbral_minimo, 5) as umbral_minimo
      FROM productos p
      LEFT JOIN configuracion_stock c ON p.id = c.producto_id
      WHERE p.stock <= COALESCE(c.umbral_minimo, 5)
    `)

    let alertasGeneradas = 0

    for (const producto of productosStockBajo) {
      // Verificar si ya existe una notificación activa para este producto
      const notificacionExistente = await query(
        "SELECT id FROM notificaciones WHERE producto_id = ? AND tipo = 'stock_bajo' AND estado = 'activa'",
        [producto.id],
      )

      if (notificacionExistente.length === 0) {
        const tipoAlerta = producto.stock === 0 ? "sin_stock" : "stock_bajo"
        const prioridad = producto.stock === 0 ? "alta" : "media"
        const titulo = producto.stock === 0 ? "Sin Stock" : "Stock Bajo"

        // Crear nueva notificación
        await query(
          `INSERT INTO notificaciones (
            tipo, titulo, mensaje, producto_id, prioridad, estado, fecha
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            tipoAlerta,
            titulo,
            `El producto "${producto.nombre}" ${producto.stock === 0 ? "no tiene stock disponible" : `tiene solo ${producto.stock} unidades (mínimo: ${producto.umbral_minimo})`}`,
            producto.id,
            prioridad,
            "activa",
          ],
        )

        alertasGeneradas++
      }
    }

    res.json({
      mensaje: `Se generaron ${alertasGeneradas} nuevas alertas de stock`,
      alertas_generadas: alertasGeneradas,
    })
  } catch (error) {
    console.error("❌ Error al generar alertas:", error)
    res.status(500).json({ error: "Error al generar alertas" })
  }
})

// PUT /api/notificaciones/:id/marcar-leida - Marcar notificación como leída
router.put("/:id/marcar-leida", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    await query("UPDATE notificaciones SET estado = 'leida', leido = 1, fecha_lectura = NOW() WHERE id = ?", [id])

    res.json({ mensaje: "Notificación marcada como leída" })
  } catch (error) {
    console.error("❌ Error al marcar notificación:", error)
    res.status(500).json({ error: "Error al marcar notificación como leída" })
  }
})

// DELETE /api/notificaciones/:id - Eliminar notificación
router.delete("/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  const { id } = req.params

  try {
    await query("DELETE FROM notificaciones WHERE id = ?", [id])
    res.json({ mensaje: "Notificación eliminada" })
  } catch (error) {
    console.error("❌ Error al eliminar notificación:", error)
    res.status(500).json({ error: "Error al eliminar notificación" })
  }
})

// GET /api/notificaciones/configuracion - Obtener configuración de umbrales
router.get("/configuracion", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const configuracion = await query(`
      SELECT 
        p.id,
        p.nombre,
        p.codigo,
        p.stock,
        COALESCE(c.umbral_minimo, 5) as umbral_minimo,
        c.id as config_id
      FROM productos p
      LEFT JOIN configuracion_stock c ON p.id = c.producto_id
      ORDER BY p.nombre
    `)

    res.json(configuracion)
  } catch (error) {
    console.error("❌ Error al obtener configuración:", error)
    res.status(500).json({ error: "Error al obtener configuración de stock" })
  }
})

// POST /api/notificaciones/configuracion - Actualizar umbral de un producto
router.post("/configuracion", authenticateToken, requireRole("admin"), async (req, res) => {
  const { producto_id, umbral_minimo } = req.body

  if (!producto_id || umbral_minimo < 0) {
    return res.status(400).json({ error: "Datos inválidos" })
  }

  try {
    // Verificar si ya existe configuración
    const configExistente = await query("SELECT id FROM configuracion_stock WHERE producto_id = ?", [producto_id])

    if (configExistente.length > 0) {
      // Actualizar
      await query(
        "UPDATE configuracion_stock SET umbral_minimo = ?, fecha_actualizacion = NOW() WHERE producto_id = ?",
        [umbral_minimo, producto_id],
      )
    } else {
      // Crear nuevo
      await query("INSERT INTO configuracion_stock (producto_id, umbral_minimo, fecha_creacion) VALUES (?, ?, NOW())", [
        producto_id,
        umbral_minimo,
      ])
    }

    res.json({ mensaje: "Configuración actualizada correctamente" })
  } catch (error) {
    console.error("❌ Error al actualizar configuración:", error)
    res.status(500).json({ error: "Error al actualizar configuración" })
  }
})

// POST /api/notificaciones/crear - Crear notificación manual
router.post("/crear", authenticateToken, requireRole("admin"), async (req, res) => {
  const { tipo, titulo, mensaje, usuario_id, producto_id, prioridad = "media" } = req.body

  if (!tipo || !titulo || !mensaje) {
    return res.status(400).json({ error: "Tipo, título y mensaje son requeridos" })
  }

  try {
    await query(
      `INSERT INTO notificaciones (
        tipo, titulo, mensaje, usuario_id, producto_id, prioridad, estado, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, 'activa', NOW())`,
      [tipo, titulo, mensaje, usuario_id, producto_id, prioridad],
    )

    res.json({ mensaje: "Notificación creada correctamente" })
  } catch (error) {
    console.error("❌ Error al crear notificación:", error)
    res.status(500).json({ error: "Error al crear notificación" })
  }
})

export default router
