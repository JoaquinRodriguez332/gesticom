"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardMetrics from "@/components/dashboard-metrics"
import NotificacionesPanel from "@/components/notificaciones-panel"
import { Package, ShoppingCart, Clock, Users, BarChart3, LogOut, Store, Shield, User } from "lucide-react"

export default function DashboardPage() {
  const { usuario, isAuthenticated, isLoading, logout, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!isAuthenticated || !usuario) {
    return null
  }

  // Módulos disponibles según el rol - SIN NOTIFICACIONES
  const modulos = [
    {
      id: "inventario",
      titulo: "Inventario",
      descripcion: "Gestión de productos",
      icono: Package,
      disponible: true,
      soloOwner: true,
    },
    {
      id: "ventas",
      titulo: "Ventas",
      descripcion: "Registro de ventas",
      icono: ShoppingCart,
      disponible: true,
    },
    {
      id: "horarios",
      titulo: "Horarios",
      descripcion: "Control de asistencia",
      icono: Clock,
      disponible: true,
    },
    {
      id: "usuarios",
      titulo: "Usuarios",
      descripcion: "Gestión de personal",
      icono: Users,
      disponible: true,
      soloOwner: true,
    },
    {
      id: "reportes",
      titulo: "Reportes",
      descripcion: "Análisis y estadísticas",
      icono: BarChart3,
      disponible: true,
      soloOwner: true,
    },
  ]

  // Filtrar módulos según el rol
  const modulosDisponibles = modulos.filter((modulo) => {
    if (modulo.soloOwner && !hasRole("admin")) {
      return false
    }
    return true
  })

  const handleModuloClick = (modulo: any) => {
    if (!modulo.disponible) {
      return
    }

    switch (modulo.id) {
      case "inventario":
        router.push("/dashboard/inventario")
        break
      case "ventas":
        router.push("/dashboard/ventas")
        break
      case "horarios":
        router.push("/dashboard/horarios")
        break
      case "usuarios":
        router.push("/dashboard/usuarios")
        break
      case "reportes":
        router.push("/dashboard/reportes")
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <div className="bg-gray-900 rounded-lg p-2">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GestiCom Dashboard</h1>
                <p className="text-xs text-gray-500">Sistema de gestión comercial</p>
              </div>
            </div>

            {/* Usuario y acciones */}
            <div className="flex items-center space-x-4">
              {/* Panel de notificaciones */}
              <NotificacionesPanel />

              {/* Info del usuario */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
                  <div className="flex items-center justify-end space-x-1">
                    {usuario.rol === "admin" ? (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Trabajador
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Métricas del Dashboard */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h2>
            <DashboardMetrics />
          </div>

          {/* Launchpad de Módulos - Ahora con 5 módulos en lugar de 6 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Módulos del Sistema</h2>
            <div className="w-full max-w-4xl mx-auto">
              {/* Grid centrado para 5 módulos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {/* Primera fila - 3 módulos */}
                {modulosDisponibles.slice(0, 3).map((modulo) => {
                  const IconoComponente = modulo.icono

                  return (
                    <div
                      key={modulo.id}
                      className={`
                        group cursor-pointer transition-all duration-300 transform hover:scale-105
                        ${modulo.disponible ? "opacity-100" : "opacity-60"}
                      `}
                      onClick={() => handleModuloClick(modulo)}
                    >
                      <div className="text-center">
                        <div
                          className={`
                            w-28 h-28 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 shadow-lg border-2
                            ${
                              modulo.disponible
                                ? "bg-white border-gray-200 hover:border-gray-300 group-hover:shadow-xl"
                                : "bg-gray-50 border-gray-200"
                            }
                          `}
                        >
                          <IconoComponente
                            className={`h-12 w-12 ${modulo.disponible ? "text-gray-900" : "text-gray-400"}`}
                          />
                        </div>

                        <h3
                          className={`
                            font-semibold text-base mb-1
                            ${modulo.disponible ? "text-gray-900" : "text-gray-500"}
                          `}
                        >
                          {modulo.titulo}
                        </h3>

                        <p
                          className={`
                            text-sm
                            ${modulo.disponible ? "text-gray-600" : "text-gray-400"}
                          `}
                        >
                          {modulo.descripcion}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Segunda fila - 2 módulos centrados */}
              {modulosDisponibles.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center mt-12 max-w-2xl mx-auto">
                  {modulosDisponibles.slice(3, 5).map((modulo) => {
                    const IconoComponente = modulo.icono

                    return (
                      <div
                        key={modulo.id}
                        className={`
                          group cursor-pointer transition-all duration-300 transform hover:scale-105
                          ${modulo.disponible ? "opacity-100" : "opacity-60"}
                        `}
                        onClick={() => handleModuloClick(modulo)}
                      >
                        <div className="text-center">
                          <div
                            className={`
                              w-28 h-28 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 shadow-lg border-2
                              ${
                                modulo.disponible
                                  ? "bg-white border-gray-200 hover:border-gray-300 group-hover:shadow-xl"
                                  : "bg-gray-50 border-gray-200"
                              }
                            `}
                          >
                            <IconoComponente
                              className={`h-12 w-12 ${modulo.disponible ? "text-gray-900" : "text-gray-400"}`}
                            />
                          </div>

                          <h3
                            className={`
                              font-semibold text-base mb-1
                              ${modulo.disponible ? "text-gray-900" : "text-gray-500"}
                            `}
                          >
                            {modulo.titulo}
                          </h3>

                          <p
                            className={`
                              text-sm
                              ${modulo.disponible ? "text-gray-600" : "text-gray-400"}
                            `}
                          >
                            {modulo.descripcion}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mensaje informativo */}
          <div className="text-center mt-12 text-gray-500">
            <p className="text-sm">Haz clic en cualquier módulo para acceder a sus funciones</p>
            <p className="text-xs mt-1">
              Bienvenido, <span className="font-medium">{usuario.nombre}</span> • Rol:{" "}
              <span className="font-medium capitalize">{usuario.rol}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
