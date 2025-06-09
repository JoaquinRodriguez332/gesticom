// Script para probar la conexión con el servidor
async function testServerConnection() {
  console.log("🔍 Probando conexión con el servidor...\n")

  try {
    // Probar endpoint de salud
    const healthResponse = await fetch("http://localhost:3001/api/health")

    if (healthResponse.ok) {
      console.log("✅ Servidor backend está funcionando")
    } else {
      console.log("❌ Servidor backend no responde correctamente")
      return
    }

    // Probar login con credenciales
    console.log("\n🔐 Probando login...")

    const loginResponse = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@gesticom.cl",
        password: "admin123",
      }),
    })

    const loginResult = await loginResponse.json()

    if (loginResponse.ok) {
      console.log("✅ Login exitoso!")
      console.log("📄 Respuesta:", loginResult)
    } else {
      console.log("❌ Error en login:")
      console.log("📄 Error:", loginResult)
      console.log("📄 Status:", loginResponse.status)
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)
    console.log("\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3001")
  }
}

// Ejecutar test
testServerConnection()
