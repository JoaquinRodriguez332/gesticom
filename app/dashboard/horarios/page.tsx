"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, CheckCircle, Coffee, RotateCcw, LogOut, Calendar } from "lucide-react"
import { useColacionStatus } from "@/hooks/useColacionStatus"

type RegistroHorario = {
  fecha: string
  hora_entrada: string | null
  hora_inicio_colacion: string | null
  hora_fin_colacion: string | null
  hora_salida: string | null
}

export default function HorariosPage() {
  const { isAuthenticated, isLoading, token } = useAuth()
  const [registros, setRegistros] = useState<RegistroHorario[]>([])
  const [botonesDeshabilitados, setBotonesDeshabilitados] = useState<Record<string, boolean>>({})
  const [procesando, setProcesando] = useState<Record<string, boolean>>({}) // 🆕 Estado de procesamiento
  const router = useRouter()
  const { toast } = useToast()
  const { iniciarColacion, terminarColacion } = useColacionStatus()

  const tipos = [
    {
      tipo: "entrada",
      label: "Entrada",
      icon: CheckCircle,
      color: "bg-green-100 hover:bg-green-200 text-green-700 border border-green-200",
      colorDeshabilitado: "bg-green-50 text-green-400 border border-green-100",
      description: "Marcar llegada",
      emoji: "✅",
    },
    {
      tipo: "inicio_colacion",
      label: "Iniciar Colación",
      icon: Coffee,
      color: "bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200",
      colorDeshabilitado: "bg-orange-50 text-orange-400 border border-orange-100",
      description: "Comenzar descanso",
      emoji: "🍽️",
    },
    {
      tipo: "fin_colacion",
      label: "Terminar Colación",
      icon: RotateCcw,
      color: "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200",
      colorDeshabilitado: "bg-blue-50 text-blue-400 border border-blue-100",
      description: "Finalizar descanso",
      emoji: "🔄",
    },
    {
      tipo: "salida",
      label: "Salida",
      icon: LogOut,
      color: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200",
      colorDeshabilitado: "bg-red-50 text-red-400 border border-red-100",
      description: "Marcar salida",
      emoji: "🚪",
    },
  ]

  const marcar = async (tipo: string) => {
    // 🚫 VALIDACIÓN FRONTEND: Si ya está deshabilitado, no hacer nada
    if (botonesDeshabilitados[tipo]) {
      toast({
        variant: "destructive",
        title: "Ya marcado",
        description: "Esta marcación ya fue registrada hoy",
        duration: 3000,
      })
      return
    }

    // 🚫 VALIDACIÓN: Si ya está procesando, no hacer nada
    if (procesando[tipo]) {
      return
    }

    // 🔒 DESHABILITAR INMEDIATAMENTE para evitar doble clic
    setProcesando((prev) => ({ ...prev, [tipo]: true }))
    setBotonesDeshabilitados((prev) => ({ ...prev, [tipo]: true }))

    try {
      console.log(`🔄 Marcando ${tipo}...`)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/horarios/marcar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo }),
      })

      const data = await res.json()

      if (res.ok) {
        // ✅ ÉXITO
        const tipoInfo = tipos.find((t) => t.tipo === tipo)

        if (tipo === "inicio_colacion") {
          const horaActual = new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
          iniciarColacion(horaActual)
          toast({
            title: "Colación iniciada",
            description: `🍽️ Sistema de ventas bloqueado desde las ${horaActual}`,
            duration: 4000,
          })
        } else if (tipo === "fin_colacion") {
          terminarColacion()
          toast({
            title: "Colación terminada",
            description: "🔄 Sistema de ventas habilitado nuevamente",
            duration: 4000,
          })
        } else {
          toast({
            title: "Marcación registrada",
            description: `${tipoInfo?.emoji} ${tipoInfo?.label} registrada correctamente`,
            duration: 3000,
          })
        }

        // 🔄 RECARGAR DATOS
        await cargarRegistros()
      } else {
        // ❌ ERROR DEL SERVIDOR
        console.error("❌ Error del servidor:", data)

        // 🔓 REHABILITAR BOTÓN si hay error
        setBotonesDeshabilitados((prev) => ({ ...prev, [tipo]: false }))

        // 🚨 MOSTRAR ERROR ESPECÍFICO
        if (res.status === 409 || data.ya_marcado) {
          toast({
            variant: "destructive",
            title: "Ya marcado",
            description: data.error || "Esta marcación ya fue registrada hoy",
            duration: 5000,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error en la marcación",
            description: data.error || "No se pudo registrar la marcación",
            duration: 5000,
          })
        }
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err)

      // 🔓 REHABILITAR BOTÓN si hay error de conexión
      setBotonesDeshabilitados((prev) => ({ ...prev, [tipo]: false }))

      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Intenta nuevamente.",
        duration: 5000,
      })
    } finally {
      // 🔓 QUITAR ESTADO DE PROCESAMIENTO
      setProcesando((prev) => ({ ...prev, [tipo]: false }))
    }
  }

  const cargarRegistros = async () => {
    try {
      console.log("📅 Cargando registros...")

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/horarios/mis-registros`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) {
        throw new Error("Error al cargar registros")
      }

      const data: RegistroHorario[] = await res.json()
      setRegistros(data)

      // 🔍 BUSCAR REGISTRO DE HOY
      const hoy = new Date().toISOString().slice(0, 10)
      const hoyRegistro = data.find((r) => r.fecha === hoy)

      console.log("🔍 Registro de hoy:", hoyRegistro)

      // 🔒 CONFIGURAR ESTADOS DE BOTONES
      const nuevosEstados = {
        entrada: !!hoyRegistro?.hora_entrada,
        inicio_colacion: !!hoyRegistro?.hora_inicio_colacion,
        fin_colacion: !!hoyRegistro?.hora_fin_colacion,
        salida: !!hoyRegistro?.hora_salida,
      }

      console.log("🔒 Estados de botones:", nuevosEstados)
      setBotonesDeshabilitados(nuevosEstados)
    } catch (error) {
      console.error("❌ Error al cargar registros:", error)
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: "No se pudieron cargar los registros de horarios",
        duration: 5000,
      })
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      let fechaObj
      if (fecha.includes("T")) {
        fechaObj = new Date(fecha)
      } else {
        fechaObj = new Date(fecha + "T12:00:00.000Z")
      }

      if (isNaN(fechaObj.getTime())) {
        return fecha
      }

      return fechaObj.toLocaleDateString("es-ES", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return fecha
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    } else if (isAuthenticated) {
      cargarRegistros()
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-900 rounded-lg p-2">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Control de Horarios</h1>
                  <p className="text-xs text-gray-500">Registro de asistencia y colación</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString("es-ES")}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Botones de Marcación */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Clock className="h-5 w-5" />
              <span>Marcaciones del Día</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tipos.map((btn) => {
                const IconComponent = btn.icon
                const isDisabled = botonesDeshabilitados[btn.tipo]
                const isProcesando = procesando[btn.tipo]

                return (
                  <Button
                    key={btn.tipo}
                    onClick={() => marcar(btn.tipo)}
                    disabled={isDisabled || isProcesando} // 🔒 Deshabilitar si está marcado O procesando
                    className={`h-20 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                      isDisabled || isProcesando ? btn.colorDeshabilitado + " cursor-not-allowed" : btn.color
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{btn.label}</div>
                      <div className="text-xs opacity-75">{btn.description}</div>
                    </div>
                    {isProcesando && (
                      <div className="text-xs bg-white/50 px-2 py-1 rounded border">⏳ Procesando...</div>
                    )}
                    {isDisabled && !isProcesando && (
                      <div className="text-xs bg-white/50 px-2 py-1 rounded border">✓ Registrado</div>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Calendar className="h-5 w-5" />
              <span>Historial Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Entrada</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Inicio Colación</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Fin Colación</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Salida</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index === 0 ? "bg-gray-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {index === 0 && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                          <span className={index === 0 ? "font-medium text-gray-900" : "text-gray-700"}>
                            {formatearFecha(registro.fecha)}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {registro.hora_entrada ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                            {registro.hora_entrada}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {registro.hora_inicio_colacion ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-200">
                            {registro.hora_inicio_colacion}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {registro.hora_fin_colacion ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            {registro.hora_fin_colacion}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {registro.hora_salida ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                            {registro.hora_salida}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {registros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay registros de horarios aún</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
