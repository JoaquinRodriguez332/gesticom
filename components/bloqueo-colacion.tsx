"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Coffee, Clock } from "lucide-react"

interface BloqueoColacionProps {
  horaInicio: string
}

export function BloqueoColacion({ horaInicio }: BloqueoColacionProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border border-orange-200">
        <CardContent className="p-8 text-center">
          {/* Icono animado */}
          <div className="mb-6">
            <div className="bg-orange-100 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <Coffee className="h-10 w-10 text-orange-600 animate-pulse" />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema Bloqueado</h2>

          {/* Mensaje */}
          <p className="text-gray-600 mb-4">Estás en horario de colación y no puedes acceder al sistema de ventas.</p>

          {/* Información de tiempo */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
            <div className="flex items-center justify-center space-x-2 text-orange-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Colación iniciada a las {horaInicio}</span>
            </div>
          </div>

          {/* Instrucciones */}
          <p className="text-sm text-gray-500">
            Para continuar trabajando, debes marcar el fin de tu colación en el módulo de horarios.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
