"use client"

import { useState, useEffect } from "react"

interface ColacionStatus {
  enColacion: boolean
  horaInicio: string | null
  iniciarColacion: (hora: string) => void
  terminarColacion: () => void
}

export const useColacionStatus = (): ColacionStatus => {
  const [enColacion, setEnColacion] = useState(false)
  const [horaInicio, setHoraInicio] = useState<string | null>(null)

  useEffect(() => {
    // Cargar estado desde localStorage al inicializar
    const estadoGuardado = localStorage.getItem("estado_colacion")
    const horaGuardada = localStorage.getItem("hora_inicio_colacion")

    if (estadoGuardado === "true" && horaGuardada) {
      setEnColacion(true)
      setHoraInicio(horaGuardada)
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
