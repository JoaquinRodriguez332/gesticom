import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import sqlite3 from "sqlite3"
import path from "path"
import { fileURLToPath } from "url"
import { testConnection, query, queryOne } from "./config/database.js"

// Importar rutas de autenticación y usuarios

// Importar rutas de autenticación, usuarios y ventas
import authRoutes from "./routes/auth.js"
import usuariosRoutes from "./routes/usuarios.js"
import ventasRoutes from "./routes/ventas.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Middleware para capturar IP sin sobrescribir req.ip
app.use((req, res, next) => {
  req.clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip
  next()
})

// Probar conexión a la base de datos al iniciar
testConnection()

// Configurar base de datos SQLite
const db = new sqlite3.Database(path.join(__dirname, "inventory.db"))

// Crear tabla de productos si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      proveedor TEXT NOT NULL,
      fecha_registro DATE DEFAULT CURRENT_DATE,
      ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Insertar datos de ejemplo si la tabla está vacía
  db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
    if (row.count === 0) {
      const productosEjemplo = [
        {
          codigo: "123456789",
          nombre: "Laptop Dell XPS 13",
          descripcion: "Laptop ultrabook con procesador Intel i7",
          precio: 1299.99,
          stock: 15,
          categoria: "Electrónicos",
          proveedor: "Dell Inc.",
        },
        {
          codigo: "987654321",
          nombre: "Mouse Logitech MX Master",
          descripcion: "Mouse inalámbrico ergonómico",
          precio: 89.99,
          stock: 32,
          categoria: "Accesorios",
          proveedor: "Logitech",
        },
        {
          codigo: "456789123",
          nombre: 'Monitor Samsung 27"',
          descripcion: "Monitor 4K UHD con tecnología HDR",
          precio: 349.99,
          stock: 8,
          categoria: "Monitores",
          proveedor: "Samsung",
        },
      ]

      const stmt = db.prepare(`
        INSERT INTO productos (codigo, nombre, descripcion, precio, stock, categoria, proveedor)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)

      productosEjemplo.forEach((producto) => {
        stmt.run(
          producto.codigo,
          producto.nombre,
          producto.descripcion,
          producto.precio,
          producto.stock,
          producto.categoria,
          producto.proveedor,
        )
      })

      stmt.finalize()
    }
  })
})

// Rutas de autenticación y usuarios
app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)

// Rutas de la API de productos (existentes)

// GET - Obtener todos los productos
app.get("/api/productos", async (req, res) => {
  try {
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
    res.json(productos)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET - Obtener un producto por ID
app.get("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params

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
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.json(producto)
  } catch (error) {
    console.error("Error al obtener producto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET - Buscar producto por código o nombre para eliminación
app.get("/api/productos/buscar/:termino", async (req, res) => {
  try {
    const { termino } = req.params

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
      return res.status(404).json({ error: "No se encontraron productos con ese código o nombre" })
    }

    res.json(productos)
  } catch (error) {
    console.error("Error al buscar producto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// POST - Crear un nuevo producto
app.post("/api/productos", async (req, res) => {
  try {
    const { codigo, nombre, descripcion, precio, stock, categoria, proveedor } = req.body

    // Validaciones básicas
    if (!codigo || !nombre || !precio || stock === undefined || !categoria || !proveedor) {
      return res.status(400).json({ error: "Faltan campos requeridos" })
    }

    // Verificar si el código ya existe
    const existingProduct = await queryOne("SELECT id FROM productos WHERE codigo = ?", [codigo])

    if (existingProduct) {
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

    res.status(201).json(newProduct)
  } catch (error) {
    console.error("Error al crear producto:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "El código de producto ya existe" })
    } else {
      res.status(500).json({ error: "Error interno del servidor" })
    }
  }
})

// PUT - Actualizar un producto
app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, precio, stock, categoria, proveedor } = req.body

    // Validaciones básicas
    if (!nombre || !precio || stock === undefined || !categoria || !proveedor) {
      return res.status(400).json({ error: "Faltan campos requeridos" })
    }

    const sql = `
      UPDATE productos 
      SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, proveedor = ?
      WHERE id = ?
    `

    const result = await query(sql, [nombre, descripcion, precio, stock, categoria, proveedor, id])

    if (result.affectedRows === 0) {
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

    res.json(updatedProduct)
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// DELETE - Eliminar un producto
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await query("DELETE FROM productos WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" })
    }

    res.json({ message: "Producto eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET - Obtener estadísticas del inventario
app.get("/api/estadisticas", async (req, res) => {
  try {
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_productos,
        SUM(stock) as total_stock,
        COUNT(CASE WHEN stock <= 5 THEN 1 END) as productos_stock_bajo,
        COUNT(DISTINCT categoria) as total_categorias,
        AVG(precio) as precio_promedio
      FROM productos
    `)

    res.json(stats)
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// GET - Obtener productos con stock bajo
app.get("/api/productos/stock-bajo", async (req, res) => {
  try {
    const { limite = 5 } = req.query

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
    res.json(productos)
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Ruta de salud del servidor
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = await testConnection()
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
    })
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    })
  }
})

// Manejo de errores 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error("Error no manejado:", error)
  res.status(500).json({ error: "Error interno del servidor" })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📊 API disponible en http://localhost:${PORT}/api`)
  console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`)
})

// Manejo de cierre graceful
process.on("SIGINT", () => {
  console.log("\n🔄 Cerrando servidor...")
  db.close((err) => {
    if (err) {
      console.error("❌ Error al cerrar la base de datos:", err.message)
    } else {
      console.log("✅ Base de datos cerrada correctamente")
    }
    process.exit(0)
  })
})

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada:", reason)
  process.exit(1)
})
