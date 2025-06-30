"use client"

import { useState, useEffect } from "react"

export function useColacionStatus() {
  const [enColacion, setEnColacion] = useState(false)
  const [horaInicio, setHoraInicio] = useState<string | null>(null)

  // Cargar estado al inicializar
  useEffect(() => {
    const estadoColacion = localStorage.getItem("estado_colacion")
    const horaInicioGuardada = localStorage.getItem("hora_inicio_colacion")

    if (estadoColacion === "true") {
      setEnColacion(true)
      setHoraInicio(horaInicioGuardada)
    }
  }, [])

  const iniciarColacion = (hora: string) => {
    setEnColacion(true)
    setHoraInicio(hora)
    localStorage.setItem("estado_colacion", "true")
    localStorage.setItem("hora_inicio_colacion", hora)
  }

  const terminarColacion = () => {
    setEnColacion(false)
    setHoraInicio(null)
    localStorage.removeItem("estado_colacion")
    localStorage.removeItem("hora_inicio_colacion")
  }

  return {
    enColacion,
    horaInicio,
    iniciarColacion,
    terminarColacion,
  }
}
