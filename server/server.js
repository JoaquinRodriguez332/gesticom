import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { testConnection } from "./config/database.js"

// Importar rutas organizadas
import authRoutes from "./routes/auth.js"
import usuariosRoutes from "./routes/usuarios.js"
import ventasRoutes from "./routes/ventas.js"
import productosRoutes from "./routes/productos.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://gesticom.vercel.app", // ← Cambia por tu URL real de frontend
      "https://tu-frontend.vercel.app",
    ],
    credentials: true,
  }),
)
app.use(express.json())

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

// ✅ RUTAS ORGANIZADAS Y LIMPIAS
app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/ventas", ventasRoutes)
app.use("/api/productos", productosRoutes)

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Servidor GestiCom funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// Ruta de salud del servidor
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = await testConnection()
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected ✅" : "disconnected ❌",
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected ❌",
      error: error.message,
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
      console.error("❌ No se pudo conectar a la base de datos PostgreSQL")
    } else {
      console.log("✅ Base de datos PostgreSQL conectada correctamente")
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
  process.exit(0)
})

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada:", reason)
  process.exit(1)
})

export default app
