"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Shield, User, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import NotificacionesPanel from "./notificaciones-panel"

const DashboardHeader: React.FC = () => {
  const { usuario, logout } = useAuth()

  if (!usuario) return null

  return (
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
            {/* Notificaciones */}
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

            {/* Botón de logout */}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
