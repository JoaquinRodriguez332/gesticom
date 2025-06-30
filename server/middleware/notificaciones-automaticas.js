import { query } from "../config/database.js"

// Función para verificar y crear notificaciones de stock bajo automáticamente
export const verificarStockBajo = async (producto_id) => {
  try {
    // Obtener información del producto y su umbral
    const producto = await query(
      `
      SELECT 
        p.*,
        COALESCE(c.umbral_minimo, 5) as umbral_minimo
      FROM productos p
      LEFT JOIN configuracion_stock c ON p.id = c.producto_id
      WHERE p.id = ?
    `,
      [producto_id],
    )

    if (producto.length === 0) return

    const prod = producto[0]

    // Si el stock está por debajo del umbral
    if (prod.stock <= prod.umbral_minimo) {
      // Verificar si ya existe una notificación activa
      const notificacionExistente = await query(
        "SELECT id FROM notificaciones WHERE producto_id = ? AND tipo IN ('stock_bajo', 'sin_stock') AND estado = 'activa'",
        [producto_id],
      )

      if (notificacionExistente.length === 0) {
        const tipoAlerta = prod.stock === 0 ? "sin_stock" : "stock_bajo"
        const prioridad = prod.stock === 0 ? "alta" : "media"
        const titulo = prod.stock === 0 ? "Sin Stock" : "Stock Bajo"

        await query(
          `INSERT INTO notificaciones (
            tipo, titulo, mensaje, producto_id, prioridad, estado, fecha
          ) VALUES (?, ?, ?, ?, ?, 'activa', NOW())`,
          [
            tipoAlerta,
            titulo,
            `El producto "${prod.nombre}" ${prod.stock === 0 ? "no tiene stock disponible" : `tiene solo ${prod.stock} unidades (mínimo: ${prod.umbral_minimo})`}`,
            producto_id,
            prioridad,
          ],
        )

        console.log(`🔔 Notificación de ${tipoAlerta} creada para producto: ${prod.nombre}`)
      }
    } else {
      // Si el stock está bien, eliminar notificaciones de stock bajo existentes
      await query(
        "UPDATE notificaciones SET estado = 'archivada' WHERE producto_id = ? AND tipo IN ('stock_bajo', 'sin_stock') AND estado = 'activa'",
        [producto_id],
      )
    }
  } catch (error) {
    console.error("❌ Error al verificar stock bajo:", error)
  }
}

// Función para crear notificación de venta
export const notificarVenta = async (venta_id, total, usuario_nombre) => {
  try {
    // Solo notificar ventas grandes (más de $10,000)
    if (total > 10000) {
      await query(
        `INSERT INTO notificaciones (
          tipo, titulo, mensaje, prioridad, estado, fecha
        ) VALUES (?, ?, ?, ?, 'activa', NOW())`,
        [
          "venta_alta",
          "Venta Importante",
          `Venta #${venta_id} por ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(total)} realizada por ${usuario_nombre}`,
          "media",
        ],
      )
    }
  } catch (error) {
    console.error("❌ Error al notificar venta:", error)
  }
}
