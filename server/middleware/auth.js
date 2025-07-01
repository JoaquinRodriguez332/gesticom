import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { queryOne } from "../config/database.js"

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_muy_segura"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

// Middleware de autenticación
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Token de acceso requerido" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Verificar que el usuario existe y está activo
    const usuario = await queryOne(
      "SELECT id, nombre, rut, correo, rol, estado FROM usuarios WHERE id = ? AND estado = 'habilitado'",
      [decoded.userId],
    )

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado o inactivo" })
    }

    // Mapear campos para compatibilidad con el frontend
    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      rut: usuario.rut,
      email: usuario.correo,
      rol: usuario.rol,
      activo: usuario.estado === "habilitado",
    }

    next()
  } catch (error) {
    console.error("Error en autenticación:", error)
    return res.status(403).json({ error: "Token inválido" })
  }
}

// Middleware de autorización por rol
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" })
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]

    if (!userRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso",
        requiredRole: roles,
        userRole: req.user.rol,
      })
    }

    next()
  }
}

// Funciones de utilidad
export const generateToken = (userId, rol) => {
  return jwt.sign({ userId, rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const hashPassword = async (password) => {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Validar formato de RUT chileno (acepta con o sin puntos)
export const validateRUT = (rut) => {
  if (!rut) return false;

  // Eliminar puntos y pasar todo a minúsculas
  rut = rut.replace(/\./g, "").toLowerCase();

  const rutRegex = /^[0-9]+-[0-9k]{1}$/;
  if (!rutRegex.test(rut)) return false;

  const [number, dv] = rut.split("-");
  let sum = 0;
  let multiplier = 2;

  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedDV = 11 - remainder === 11 ? 0 : 11 - remainder;
  const providedDV = dv === "k" ? 10 : parseInt(dv);

  return calculatedDV === providedDV;
};


// Validar contraseña segura
export const validatePassword = (password) => {
  const minLength = 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)

  return {
    isValid: password.length >= minLength && hasLetter && hasNumber,
    errors: [
      ...(password.length < minLength ? [`Mínimo ${minLength} caracteres`] : []),
      ...(!hasLetter ? ["Debe contener al menos una letra"] : []),
      ...(!hasNumber ? ["Debe contener al menos un número"] : []),
    ],
  }
}
