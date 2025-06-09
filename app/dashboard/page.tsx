"use client"

import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  ShoppingCart,
  Clock,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Store,
  Shield,
  User,
  TrendingUp,
} from "lucide-react"

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

  // Módulos disponibles según el rol
  const modulos = [
    {
      id: "inventario",
      titulo: "Inventario",
      descripcion: "Gestión de productos",
      icono: Package,
      disponible: true,
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
      disponible: false,
      soloOwner: true,
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
      disponible: false,
    },
    {
      id: "notificaciones",
      titulo: "Notificaciones",
      descripcion: "Alertas del sistema",
      icono: Bell,
      disponible: false,
    },
  ]

  // Filtrar módulos según el rol
  const modulosDisponibles = modulos.filter((modulo) => {
    if (modulo.soloOwner && !hasRole("dueño")) {
      return false
    }
    return true
  })

  const handleModuloClick = (modulo: (typeof modulos)[0]) => {
    if (!modulo.disponible) {
      return
    }

    if (modulo.id === "usuarios") {
      router.push("/dashboard/usuarios")
    } else {
      if (modulo.id === "inventario") {
        router.push("/dashboard/inventario")
      }
    }
    if (modulo.id === "ventas") {
      router.push("/dashboard/ventas")
    }
    if (modulo.id === "horarios") {
      router.push("/dashboard/horarios")
    }
    if (modulo.id === "reportes") {
      router.push("/dashboard/reportes")
    }
    if (modulo.id === "notificaciones") {
      router.push("/dashboard/notificaciones")
    }
    if (modulo.id === "notificaciones") {
      router.push("/dashboard/notificaciones")
    }
  }

  // Dividir módulos en dos filas
  const primeraFila = modulosDisponibles.slice(0, 3)
  const segundaFila = modulosDisponibles.slice(3, 6)

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
              </div>
            </div>

            {/* Usuario y acciones */}
            <div className="flex items-center space-x-4">
              {/* Info del usuario */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
                  <div className="flex items-center justify-end space-x-1">
                    {usuario.rol === "dueño" ? (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Dueño
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

              {/* Botones de acción */}
                
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">+15.3% desde el mes pasado</p>
            </CardContent>
          </Card>

          {hasRole("dueño") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 nuevos este mes</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground">Comparado con el año pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Launchpad de Módulos - 2 filas de 3 iconos minimalistas */}
        <div className="w-full max-w-5xl mx-auto space-y-16">
          {/* Primera fila */}
          <div className="grid grid-cols-3 gap-12 justify-items-center">
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
                    {/* Icono minimalista - fondo blanco, icono negro */}
                    <div
                      className={`
                        w-32 h-32 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-300 shadow-lg border-2
                        ${
                          modulo.disponible
                            ? "bg-white border-gray-200 hover:border-gray-300 group-hover:shadow-xl"
                            : "bg-gray-50 border-gray-200"
                        }
                      `}
                    >
                      <IconoComponente
                        className={`h-16 w-16 ${modulo.disponible ? "text-gray-900" : "text-gray-400"}`}
                      />
                    </div>

                    {/* Título */}
                    <h3
                      className={`
                        font-semibold text-lg mb-2
                        ${modulo.disponible ? "text-gray-900" : "text-gray-500"}
                      `}
                    >
                      {modulo.titulo}
                    </h3>

                    {/* Descripción */}
                    <p
                      className={`
                        text-sm
                        ${modulo.disponible ? "text-gray-600" : "text-gray-400"}
                      `}
                    >
                      {modulo.descripcion}
                    </p>

                    {/* Badge para módulos no disponibles */}
                    {!modulo.disponible && (
                      <Badge variant="secondary" className="mt-3 text-xs">
                        Próximamente
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Segunda fila */}
          {modulosDisponibles.length > 3 && (
            <div className="grid grid-cols-3 gap-12 justify-items-center">
              {modulosDisponibles.slice(3, 6).map((modulo) => {
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
                      {/* Icono minimalista - fondo blanco, icono negro */}
                      <div
                        className={`
                          w-32 h-32 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-300 shadow-lg border-2
                          ${
                            modulo.disponible
                              ? "bg-white border-gray-200 hover:border-gray-300 group-hover:shadow-xl"
                              : "bg-gray-50 border-gray-200"
                          }
                        `}
                      >
                        <IconoComponente
                          className={`h-16 w-16 ${modulo.disponible ? "text-gray-900" : "text-gray-400"}`}
                        />
                      </div>

                      {/* Título */}
                      <h3
                        className={`
                          font-semibold text-lg mb-2
                          ${modulo.disponible ? "text-gray-900" : "text-gray-500"}
                        `}
                      >
                        {modulo.titulo}
                      </h3>

                      {/* Descripción */}
                      <p
                        className={`
                          text-sm
                          ${modulo.disponible ? "text-gray-600" : "text-gray-400"}
                        `}
                      >
                        {modulo.descripcion}
                      </p>

                      {/* Badge para módulos no disponibles */}
                      {!modulo.disponible && (
                        <Badge variant="secondary" className="mt-3 text-xs">
                          Próximamente
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mensaje informativo */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">Haz clic en cualquier módulo para acceder a sus funciones</p>
        </div>
      </main>
    </div>
  )
}
