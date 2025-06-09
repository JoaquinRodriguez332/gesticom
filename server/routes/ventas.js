import express from "express"
import { query } from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Obtener todas las ventas
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("📊 Obteniendo ventas...")

    const ventas = await query(`
      SELECT v.*, u.nombre as vendedor_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.fecha DESC
    `)

    console.log(`✅ Se encontraron ${ventas.length} ventas`)

    // Obtener detalles de cada venta
    for (const venta of ventas) {
      try {
        const detalles = await query(
          `
          SELECT dv.*, p.nombre as producto_nombre
          FROM detalle_ventas dv
          LEFT JOIN productos p ON dv.producto_id = p.id
          WHERE dv.venta_id = ?
        `,
          [venta.id],
        )

        venta.items = detalles
      } catch (error) {
        console.error(`Error al obtener detalles de venta ${venta.id}:`, error)
        venta.items = []
      }
    }

    res.json(ventas)
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error)
    res.status(500).json({ message: "Error interno del servidor", error: error.message })
  }
})

// Crear nueva venta
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("🛒 Procesando nueva venta...")
    console.log("Datos recibidos:", req.body)
    console.log("Usuario:", req.user)

    const { items, total } = req.body
    const usuario_id = req.user.id

    if (!items || items.length === 0) {
      console.log("❌ Error: No hay items en la venta")
      return res.status(400).json({ message: "La venta debe tener al menos un producto" })
    }

    if (!total || total <= 0) {
      console.log("❌ Error: Total inválido")
      return res.status(400).json({ message: "El total debe ser mayor a 0" })
    }

    console.log(`📦 Verificando stock para ${items.length} productos...`)

    // Verificar stock disponible
    for (const item of items) {
      console.log(`Verificando producto ID: ${item.producto_id}, cantidad: ${item.cantidad}`)

      const productos = await query("SELECT id, nombre, stock FROM productos WHERE id = ?", [item.producto_id])

      if (productos.length === 0) {
        console.log(`❌ Producto ${item.producto_id} no encontrado`)
        return res.status(400).json({ message: `Producto con ID ${item.producto_id} no encontrado` })
      }

      const producto = productos[0]
      console.log(`Producto encontrado: ${producto.nombre}, stock: ${producto.stock}`)

      if (producto.stock < item.cantidad) {
        console.log(`❌ Stock insuficiente para ${producto.nombre}`)
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`,
        })
      }
    }

    console.log("✅ Stock verificado correctamente")

    // Crear la venta (sin especificar fecha ya que tiene DEFAULT CURRENT_TIMESTAMP)
    console.log("💾 Creando venta en base de datos...")
    const ventaResult = await query("INSERT INTO ventas (usuario_id, total, estado) VALUES (?, ?, 'activa')", [
      usuario_id,
      total,
    ])

    const venta_id = ventaResult.insertId
    console.log(`✅ Venta creada con ID: ${venta_id}`)

    // Agregar items de la venta
    console.log("📝 Agregando items de la venta...")
    for (const item of items) {
      console.log(
        `Agregando item: Producto ${item.producto_id}, Cantidad: ${item.cantidad}, Precio: ${item.precio_unitario}`,
      )

      await query("INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)", [
        venta_id,
        item.producto_id,
        item.cantidad,
        item.precio_unitario,
      ])

      // Actualizar stock
      console.log(`📦 Actualizando stock del producto ${item.producto_id}`)
      await query("UPDATE productos SET stock = stock - ? WHERE id = ?", [item.cantidad, item.producto_id])

      // Registrar movimiento de inventario
      try {
        await query(
          "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, usuario, motivo) VALUES (?, 'salida', ?, ?, ?)",
          [item.producto_id, item.cantidad, req.user.nombre, `Venta #${venta_id}`],
        )
      } catch (movError) {
        console.log("⚠️ Error al registrar movimiento (continuando):", movError.message)
      }
    }

    // Registrar actividad
    try {
      await query("INSERT INTO actividad_sistema (usuario_id, modulo, accion) VALUES (?, 'ventas', ?)", [
        usuario_id,
        `Venta procesada #${venta_id} por $${total}`,
      ])
    } catch (actError) {
      console.log("⚠️ Error al registrar actividad (continuando):", actError.message)
    }

    console.log("🎉 Venta procesada exitosamente")

    res.status(201).json({
      message: "Venta creada exitosamente",
      venta_id: venta_id,
      total: total,
    })
  } catch (error) {
    console.error("❌ Error al crear venta:", error)
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

// Anular venta (solo dueños)
router.put("/:id/anular", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🚫 Anulando venta ${id}...`)

    // Verificar que el usuario sea dueño
    if (req.user.rol !== "dueño") {
      console.log("❌ Usuario sin permisos para anular ventas")
      return res.status(403).json({ message: "No tienes permisos para anular ventas" })
    }

    // Verificar que la venta existe y está activa
    const ventas = await query("SELECT * FROM ventas WHERE id = ? AND estado = 'activa'", [id])

    if (ventas.length === 0) {
      console.log("❌ Venta no encontrada o ya anulada")
      return res.status(404).json({ message: "Venta no encontrada o ya anulada" })
    }

    const venta = ventas[0]

    // Obtener items de la venta
    const items = await query("SELECT * FROM detalle_ventas WHERE venta_id = ?", [id])
    console.log(`📦 Restaurando stock de ${items.length} productos...`)

    // Restaurar stock
    for (const item of items) {
      await query("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id])

      // Registrar movimiento de inventario
      try {
        await query(
          "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, usuario, motivo) VALUES (?, 'entrada', ?, ?, ?)",
          [item.producto_id, item.cantidad, req.user.nombre, `Anulación venta #${id}`],
        )
      } catch (movError) {
        console.log("⚠️ Error al registrar movimiento de anulación:", movError.message)
      }
    }

    // Marcar venta como anulada
    await query("UPDATE ventas SET estado = 'anulada' WHERE id = ?", [id])

    // Registrar actividad
    try {
      await query("INSERT INTO actividad_sistema (usuario_id, modulo, accion) VALUES (?, 'ventas', ?)", [
        req.user.id,
        `Venta anulada #${id}`,
      ])
    } catch (actError) {
      console.log("⚠️ Error al registrar actividad de anulación:", actError.message)
    }

    console.log("✅ Venta anulada exitosamente")
    res.json({ message: "Venta anulada exitosamente" })
  } catch (error) {
    console.error("❌ Error al anular venta:", error)
    res.status(500).json({ message: "Error interno del servidor", error: error.message })
  }
})

export default router
