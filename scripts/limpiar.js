// Script para limpiar datos de autenticación corruptos
console.log("🧹 Limpiando datos de autenticación...")

// Simular limpieza del localStorage (esto lo harás en el navegador)
console.log("Para limpiar en el navegador:")
console.log("1. Abre las DevTools (F12)")
console.log("2. Ve a la pestaña 'Application' o 'Aplicación'")
console.log("3. En el menú izquierdo, busca 'Local Storage'")
console.log("4. Selecciona tu dominio (localhost:3000)")
console.log("5. Elimina estas claves:")
console.log("   - auth_token")
console.log("   - auth_user")
console.log("6. Recarga la página")

console.log("\n🔄 O ejecuta esto en la consola del navegador:")
console.log("localStorage.removeItem('auth_token')")
console.log("localStorage.removeItem('auth_user')")
console.log("location.reload()")

console.log("\n✅ Después podrás hacer login nuevamente")
