// Test directo del endpoint de login
import fetch from "node-fetch"

async function testLoginDirecto() {
  try {
    console.log("🔍 Probando login directo...\n")

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@gesticom.cl",
        password: "admin123",
      }),
    })

    console.log("📊 Status:", response.status)
    console.log("📊 Status Text:", response.statusText)

    const data = await response.text()
    console.log("📄 Response:", data)

    if (response.ok) {
      const jsonData = JSON.parse(data)
      console.log("✅ Login exitoso!")
      console.log("🎫 Token:", jsonData.token ? "Generado" : "No generado")
      console.log("👤 Usuario:", jsonData.usuario)
    } else {
      console.log("❌ Login falló")
      try {
        const errorData = JSON.parse(data)
        console.log("📄 Error:", errorData)
      } catch {
        console.log("📄 Error raw:", data)
      }
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message)
    console.log("\n💡 Asegúrate de que el servidor esté corriendo en puerto 5000")
  }
}

testLoginDirecto()
