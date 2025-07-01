"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Usuario {
  id: number
  nombre: string
  rut: string
  email: string
  rol: "admin" | "trabajador"
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const savedToken = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("auth_user")

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUsuario(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error al cargar datos de autenticación:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("https://gesticom-production.up.railway.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data = await response.json()

      setToken(data.token)
      setUsuario(data.usuario)

      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.usuario))

      // Redirigir según el rol
      if (data.usuario.rol === "admin") {
        router.push("/dashboard")
      } else {
        router.push("/inventario")
      }
    } catch (error) {
      console.error("Error en login:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setToken(null)
      setUsuario(null)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      // 🆕 SOLO ESTAS 2 LÍNEAS SON NUEVAS
      localStorage.removeItem("estado_colacion")
      localStorage.removeItem("hora_inicio_colacion")
      router.push("/login")
    }
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!usuario) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(usuario.rol)
  }

  const value: AuthContextType = {
    usuario,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!usuario && !!token,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
