import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

// Configuración de la conexión a MySQL (corregida para MySQL2)
const dbConfig = {
  host: "caboose.proxy.rlwy.net",
  port: 59667,
  user: "root",
  password: "JoVytIKfLxShYhkBJJoBWnQdUNviwctF",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}


// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig)

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Conexión a MySQL establecida correctamente")
    connection.release()
    return true
  } catch (error) {
    console.error("❌ Error al conectar con MySQL:", error.message)
    return false
  }
}

// Función para ejecutar consultas
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params)
    return results
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
    const [results] = await pool.execute(sql, params)
    return results[0] || null
  } catch (error) {
    console.error("Error en consulta SQL:", error.message)
    throw error
  }
}

export default pool
