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
        WHERE nombre LIKE ? OR codigo LIKE ? OR categoria LIKE ?
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
      WHERE id = ?
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

// GET - Buscar producto por código o nombre para eliminación
router.get("/buscar/:termino", async (req, res) => {
  try {
    const { termino } = req.params
    console.log(`🔍 Buscando productos con término: ${termino}`)

    if (!termino || termino.trim().length === 0) {
      return res.status(400).json({ error: "Término de búsqueda requerido" })
    }

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
      WHERE codigo = ? OR nombre LIKE ?
      LIMIT 5
    `

    const productos = await query(sql, [termino, `%${termino}%`])

    if (productos.length === 0) {
      console.log(`❌ No se encontraron productos con: ${termino}`)
      return res.status(404).json({ error: "No se encontraron productos con ese código o nombre" })
    }

    console.log(`✅ Se encontraron ${productos.length} productos`)
    res.json(productos)
  } catch (error) {
    console.error("❌ Error al buscar producto:", error)
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
    const existingProduct = await queryOne("SELECT id FROM productos WHERE codigo = ?", [codigo])

    if (existingProduct) {
      console.log(`❌ Código ${codigo} ya existe`)
      return res.status(400).json({ error: "El código de producto ya existe" })
    }

    const sql = `
      INSERT INTO productos (codigo, nombre, descripcion, precio, stock, categoria, proveedor, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
    `

    const result = await query(sql, [codigo, nombre, descripcion, precio, stock, categoria, proveedor])

    // Obtener el producto recién creado
    const newProduct = await queryOne(
      `SELECT 
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
      WHERE id = ?`,
      [result.insertId],
    )

    console.log(`✅ Producto creado: ${newProduct.nombre} (ID: ${newProduct.id})`)
    res.status(201).json(newProduct)
  } catch (error) {
    console.error("❌ Error al crear producto:", error)
    if (error.code === "ER_DUP_ENTRY") {
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
      SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, proveedor = ?
      WHERE id = ?
    `

    const result = await query(sql, [nombre, descripcion, precio, stock, categoria, proveedor, id])

    if (result.affectedRows === 0) {
      console.log(`❌ Producto ${id} no encontrado`)
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    // Obtener el producto actualizado
    const updatedProduct = await queryOne(
      `SELECT 
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
      WHERE id = ?`,
      [id],
    )

    console.log(`✅ Producto actualizado: ${updatedProduct.nombre}`)
    res.json(updatedProduct)
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

    const result = await query("DELETE FROM productos WHERE id = ?", [id])

    if (result.affectedRows === 0) {
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

// GET - Obtener productos con stock bajo
router.get("/stock-bajo", async (req, res) => {
  try {
    const { limite = 5 } = req.query
    console.log(`📊 Obteniendo productos con stock bajo (límite: ${limite})`)

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
      WHERE stock <= ?
      ORDER BY stock ASC
    `

    const productos = await query(sql, [limite])
    console.log(`✅ Se encontraron ${productos.length} productos con stock bajo`)
    res.json(productos)
  } catch (error) {
    console.error("❌ Error al obtener productos con stock bajo:", error)
    res.status(500).json({ error: "Error interno del servidor", details: error.message })
  }
})

export default router
