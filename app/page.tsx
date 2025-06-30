"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { isAuthenticated, isLoading, usuario } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Si el usuario está autenticado, redirigir según su rol
        if (usuario?.rol === "admin") {
          router.push("/dashboard")
        } else {
          router.push("/inventario")
        }
      } else {
        // Si no está autenticado, redirigir al login
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoading, router, usuario])

  // Mostrar un spinner mientras se carga
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  )
}
