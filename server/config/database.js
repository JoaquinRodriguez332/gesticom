import pkg from "pg"
const { Pool } = pkg
import dotenv from "dotenv"

dotenv.config()

// Usar la POSTGRES_URL que Vercel configuró automáticamente
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

export const testConnection = async () => {
  try {
    const client = await pool.connect()
    console.log("✅ Conexión a Supabase (via Vercel) establecida correctamente")
    console.log("🔗 Conectado a:", process.env.POSTGRES_URL?.substring(0, 50) + "...")
    client.release()
    return true
  } catch (error) {
    console.error("❌ Error al conectar:", error.message)
    return false
  }
}

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
