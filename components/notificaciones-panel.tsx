"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bell, BellRing, Package, DollarSign, Check, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notificacion {
  id: number
  tipo: "stock_bajo" | "sin_stock" | "venta_alta" | "sistema"
  titulo: string
  mensaje: string
  producto_id?: number
  prioridad: "alta" | "media" | "baja"
  estado: "activa" | "leida" | "archivada"
  fecha: string
  producto_nombre?: string
  stock_actual?: number
}

const NotificacionesPanel: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { token } = useAuth()
  const { toast } = useToast()

  const fetchNotificaciones = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar notificaciones")
      }

      const data = await response.json()
      setNotificaciones(data)
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificaciones()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000)
    return () => clearInterval(interval)
  }, [token])

  const marcarComoLeida = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/notificaciones/${id}/marcar-leida`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, estado: "leida" } : notif)))
      }
    } catch (error) {
      console.error("Error al marcar como leída:", error)
    }
  }

  const eliminarNotificacion = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/notificaciones/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        setNotificaciones((prev) => prev.filter((notif) => notif.id !== id))
        toast({
          title: "Notificación eliminada",
          description: "La notificación se ha eliminado correctamente",
        })
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
    }
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case "stock_bajo":
      case "sin_stock":
        return <Package className="h-4 w-4" />
      case "venta_alta":
        return <DollarSign className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "destructive"
      case "media":
        return "default"
      case "baja":
        return "secondary"
      default:
        return "outline"
    }
  }

  const notificacionesActivas = notificaciones.filter((n) => n.estado === "activa")
  const notificacionesParaMostrar = showAll ? notificaciones : notificacionesActivas.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          {notificacionesActivas.length > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {notificacionesActivas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificacionesActivas.length > 9 ? "9+" : notificacionesActivas.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <Badge variant="outline">{notificacionesActivas.length} nuevas</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          </div>
        ) : notificacionesParaMostrar.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notificacionesParaMostrar.map((notificacion) => (
              <DropdownMenuItem key={notificacion.id} className="p-0">
                <Card className="w-full border-0 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          notificacion.prioridad === "alta"
                            ? "bg-red-100 text-red-600"
                            : notificacion.prioridad === "media"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {getIcono(notificacion.tipo)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">{notificacion.titulo}</h4>
                          <Badge variant={getPrioridadColor(notificacion.prioridad) as any} className="text-xs">
                            {notificacion.prioridad}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{notificacion.mensaje}</p>

                        {notificacion.producto_nombre && (
                          <p className="text-xs text-blue-600 mb-2">
                            📦 {notificacion.producto_nombre}
                            {notificacion.stock_actual !== undefined && ` (Stock: ${notificacion.stock_actual})`}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notificacion.fecha).toLocaleDateString("es-CL", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          <div className="flex space-x-1">
                            {notificacion.estado === "activa" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  marcarComoLeida(notificacion.id)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                eliminarNotificacion(notificacion.id)
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notificaciones.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowAll(!showAll)}>
              <span className="text-center w-full">
                {showAll ? "Ver menos" : `Ver todas (${notificaciones.length})`}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificacionesPanel
