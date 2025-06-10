import express from "express"
import { query, queryOne } from "../config/database.js"

const router = express.Router()

// GET - Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    console.log("📦 Obteniendo productos...")
    const { search } = req.query

    let sql = `
      SELECT 
        id,
        codigo,
        nombre,
        descripcion,
        precio,
        stock,
        categoria,
        proveedor,
        fecha_registro,
        ultima_actualizacion as updated_at,
        fecha_registro as created_at
      FROM productos 
      ORDER BY ultima_actualizacion DESC
    `
    let params = []

    if (search) {
      sql = `
        SELECT 
          id,
          codigo,
          nombre,
          descripcion,
          precio,
          stock,
          categoria,
          proveedor,
          fecha_registro,
          ultima_actualizacion as updated_at,
          fecha_registro as created_at
        FROM productos 
        WHERE nombre ILIKE $1 OR codigo ILIKE $2 OR categoria ILIKE $3
        ORDER BY ultima_actualizacion DESC
      `
      params = [`%${search}%`, `%${search}%`, `%${search}%`]
    }

    const productos = await query(sql, params)
    console.log(`✅ Se encontraron ${productos.length} productos`)
    res.json(productos)
  } catch (error) {
    console.error("❌ Error al obtener productos:", error)
    res.status(500).json({ error: "Error interno del servidor", details: error.message })
  }
})

// GET - Obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🔍 Buscando producto ID: ${id}`)

    const sql = `
      SELECT 
        id,
        codigo,
        nombre,
        descripcion,
        precio,
        stock,
        categoria,
        proveedor,
        fecha_registro,
        ultima_actualizacion as updated_at,
        fecha_registro as created_at
      FROM productos 
      WHERE id = $1
    `

    const producto = await queryOne(sql, [id])

    if (!producto) {
      console.log(`❌ Producto ${id} no encontrado`)
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    console.log(`✅ Producto encontrado: ${producto.nombre}`)
    res.json(producto)
  } catch (error) {
    console.error("❌ Error al obtener producto:", error)
    res.status(500).json({ error: "Error interno del servidor", details: error.message })
  }
})

// POST - Crear un nuevo producto
router.post("/", async (req, res) => {
  try {
    const { codigo, nombre, descripcion, precio, stock, categoria, proveedor } = req.body
    console.log(`📝 Creando producto: ${nombre}`)

    // Validaciones básicas
    if (!codigo || !nombre || !precio || stock === undefined || !categoria || !proveedor) {
      console.log("❌ Faltan campos requeridos")
      return res.status(400).json({ error: "Faltan campos requeridos" })
    }

    // Verificar si el código ya existe
    const existingProduct = await queryOne("SELECT id FROM productos WHERE codigo = $1", [codigo])

    if (existingProduct) {
      console.log(`❌ Código ${codigo} ya existe`)
      return res.status(400).json({ error: "El código de producto ya existe" })
    }

    const sql = `
      INSERT INTO productos (codigo, nombre, descripcion, precio, stock, categoria, proveedor, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
      RETURNING *
    `

    const result = await queryOne(sql, [codigo, nombre, descripcion, precio, stock, categoria, proveedor])

    console.log(`✅ Producto creado: ${result.nombre} (ID: ${result.id})`)
    res.status(201).json({
      ...result,
      updated_at: result.ultima_actualizacion,
      created_at: result.fecha_registro,
    })
  } catch (error) {
    console.error("❌ Error al crear producto:", error)
    if (error.code === "23505") {
      // PostgreSQL unique violation
      res.status(400).json({ error: "El código de producto ya existe" })
    } else {
      res.status(500).json({ error: "Error interno del servidor", details: error.message })
    }
  }
})

// PUT - Actualizar un producto
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, precio, stock, categoria, proveedor } = req.body
    console.log(`📝 Actualizando producto ID: ${id}`)

    // Validaciones básicas
    if (!nombre || !precio || stock === undefined || !categoria || !proveedor) {
      console.log("❌ Faltan campos requeridos")
      return res.status(400).json({ error: "Faltan campos requeridos" })
    }

    const sql = `
      UPDATE productos 
      SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5, proveedor = $6, ultima_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `

    const result = await queryOne(sql, [nombre, descripcion, precio, stock, categoria, proveedor, id])

    if (!result) {
      console.log(`❌ Producto ${id} no encontrado`)
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    console.log(`✅ Producto actualizado: ${result.nombre}`)
    res.json({
      ...result,
      updated_at: result.ultima_actualizacion,
      created_at: result.fecha_registro,
    })
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error)
    res.status(500).json({ error: "Error interno del servidor", details: error.message })
  }
})

// DELETE - Eliminar un producto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    console.log(`🗑️ Eliminando producto ID: ${id}`)

    const result = await query("DELETE FROM productos WHERE id = $1", [id])

    if (result.length === 0) {
      console.log(`❌ Producto ${id} no encontrado`)
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    console.log(`✅ Producto ${id} eliminado`)
    res.json({ message: "Producto eliminado exitosamente" })
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error)
    res.status(500).json({ error: "Error interno del servidor", details: error.message })
  }
})

export default router

