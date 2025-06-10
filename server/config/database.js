import pkg from "pg"
const { Pool } = pkg
import dotenv from "dotenv"

dotenv.config()

// Configuración de la conexión a PostgreSQL (Supabase)
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
}

// Crear el pool de conexiones
const pool = new Pool(dbConfig)

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect()
    console.log("✅ Conexión a Supabase PostgreSQL establecida correctamente")
    client.release()
    return true
  } catch (error) {
    console.error("❌ Error al conectar con Supabase:", error.message)
    return false
  }
}

// Función para ejecutar consultas
export const query = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params)
    return result.rows
  } catch (error) {
    console.error("Error en consulta SQL:", error.message)
    console.error("SQL:", sql)
    console.error("Params:", params)
    throw error
  }
}

// Función para obtener una sola fila
export const queryOne = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params)
    return result.rows[0] || null
  } catch (error) {
    console.error("Error en consulta SQL:", error.message)
    throw error
  }
}

export default pool
