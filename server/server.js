import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { testConnection } from "./config/database.js"

// Rutas organizadas
import authRoutes from "./routes/auth.js"
import usuariosRoutes from "./routes/usuarios.js"
import ventasRoutes from "./routes/ventas.js"
import productosRoutes from "./routes/productos.js"
import horariosRouter from "./routes/horarios.js"
import notificacionesRouter from "./routes/notificaciones.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares esenciales
app.use(cors())
app.use(express.json())

// Logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Rutas principales
app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/ventas", ventasRoutes)
app.use("/api/productos", productosRoutes)
app.use("/api/horarios", horariosRouter)
app.use("/api/notificaciones", notificacionesRouter)

// Ruta base de prueba
app.get("/", (req, res) => {
  res.json({ message: "🚀 Servidor GestiCom funcionando correctamente", timestamp: new Date().toISOString() })
})

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error("❌ Error no manejado:", error)
  res.status(500).json({ error: "Error interno del servidor" })
})

// Iniciar servidor
const startServer = async () => {
  try {
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error("⚠️ No se pudo conectar a la base de datos. Continuando en modo desarrollo...")
    }

    app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`)
})
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

startServer()
