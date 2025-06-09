import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import sqlite3 from "sqlite3"
import path from "path"
import { fileURLToPath } from "url"
import { testConnection, queryOne } from "./config/database.js"

// Importar rutas organizadas
import authRoutes from "./routes/auth.js"
import usuariosRoutes from "./routes/usuarios.js"
import ventasRoutes from "./routes/ventas.js"
import productosRoutes from "./routes/productos.js"


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
// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2))
  }
  next()
})

// Probar conexión a la base de datos al iniciar
testConnection()

// Configurar base de datos SQLite para productos de ejemplo
const db = new sqlite3.Database(path.join(__dirname, "inventory.db"))

// Crear tabla de productos si no existe (solo para SQLite de ejemplo)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS productos_sqlite (
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
  db.get("SELECT COUNT(*) as count FROM productos_sqlite", (err, row) => {
    if (row && row.count === 0) {
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
        INSERT INTO productos_sqlite (codigo, nombre, descripcion, precio, stock, categoria, proveedor)
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
      console.log("✅ Productos de ejemplo creados en SQLite")
    }
  })
})

// ✅ RUTAS ORGANIZADAS Y LIMPIAS
app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/ventas", ventasRoutes)
app.use("/api/productos", productosRoutes) // ✅ AHORA SÍ EXISTE

// GET - Obtener estadísticas del inventario
app.get("/api/estadisticas", async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas...")
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_productos,
        SUM(stock) as total_stock,
        COUNT(CASE WHEN stock <= 5 THEN 1 END) as productos_stock_bajo,
        COUNT(DISTINCT categoria) as total_categorias,
        AVG(precio) as precio_promedio
      FROM productos
    `)

    console.log("✅ Estadísticas obtenidas")
    res.json(stats)
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "🚀 Servidor GestiCom funcionando correctamente", timestamp: new Date().toISOString() })
})

// Ruta de prueba para ventas
app.get("/api/test-ventas", (req, res) => {
  res.json({ message: "Endpoint de ventas disponible" })
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
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error("❌ No se pudo conectar a la base de datos MySQL")
      console.log("⚠️ Continuando con SQLite para desarrollo...")
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
      console.log("📊 Rutas disponibles:")
      console.log("  🔐 POST /api/auth/login")
      console.log("  👥 GET  /api/usuarios")
      console.log("  📦 GET  /api/productos")
      console.log("  📦 POST /api/productos")
      console.log("  📦 PUT  /api/productos/:id")
      console.log("  📦 DELETE /api/productos/:id")
      console.log("  🛒 GET  /api/ventas")
      console.log("  🛒 POST /api/ventas")
      console.log("  🛒 PUT  /api/ventas/:id/anular")
      console.log("  📊 GET  /api/estadisticas")
    })
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

startServer()

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
