// Script para probar módulo de horarios
const testHorarios = async () => {
  console.log("🧪 Probando módulo de horarios...")

  try {
    // 1. Probar login
    console.log("🔐 Iniciando sesión...")
    const loginRes = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gesticom.cl",
        password: "admin123",
      }),
    })

    if (!loginRes.ok) {
      const err = await loginRes.text()
      console.log("❌ Login fallido:", err)
      return
    }

    const { token } = await loginRes.json()
    console.log("✅ Token obtenido")

    // 2. Marcar entrada
    console.log("🕓 Registrando entrada...")
    const marcarRes = await fetch("http://localhost:3001/api/registro_horarios/marcar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tipo: "entrada" }),
    })

    const marcarData = await marcarRes.json()
    if (marcarRes.ok) {
      console.log("✅ Entrada registrada:", marcarData.mensaje)
    } else {
      console.log("❌ Error al marcar entrada:", marcarData.error)
    }

    // 3. Obtener historial del usuario
    console.log("📋 Consultando historial de horarios...")
    const historialRes = await fetch("http://localhost:3001/api/horarios/mis-registros", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const historial = await historialRes.json()
    if (historialRes.ok) {
      console.log(`✅ Se obtuvieron ${historial.length} registros:`)
      historial.forEach((r, i) => {
        console.log(`📅 ${r.fecha}: Entrada: ${r.hora_entrada}, Salida: ${r.hora_salida}`)
      })
    } else {
      console.log("❌ Error al obtener historial:", historial.error)
    }

  } catch (err) {
    console.error("❌ Error en prueba de horarios:", err.message)
  }
}

testHorarios()
