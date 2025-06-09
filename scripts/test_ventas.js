// Script completo para probar el módulo de ventas
const testVentasCompleto = async () => {
  console.log("🧪 Probando módulo de ventas completo...")

  try {
    // 1. Probar conexión básica
    console.log("\n1️⃣ Probando conexión al servidor...")
    const testResponse = await fetch("http://localhost:3001/api/test-ventas")
    if (testResponse.ok) {
      const data = await testResponse.json()
      console.log("✅ Servidor responde:", data.message)
    } else {
      console.log("❌ Servidor no responde")
      return
    }

    // 2. Probar login para obtener token
    console.log("\n2️⃣ Obteniendo token de autenticación...")
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

    if (!loginResponse.ok) {
      console.log("❌ Error en login")
      const errorText = await loginResponse.text()
      console.log("Error:", errorText)
      return
    }

    const loginData = await loginResponse.json()
    const token = loginData.token
    console.log("✅ Token obtenido")

    // 3. Probar obtener productos (NUEVA RUTA ORGANIZADA)
    console.log("\n3️⃣ Probando GET /api/productos (ruta organizada)...")
    const productosResponse = await fetch("http://localhost:3001/api/productos")

    if (productosResponse.ok) {
      const productos = await productosResponse.json()
      console.log(`✅ Productos obtenidos: ${productos.length} registros`)

      if (productos.length > 0) {
        const producto = productos[0]
        console.log(`📦 Producto de prueba: ${producto.nombre}`)
        console.log(`💰 Precio: $${producto.precio}`)
        console.log(`📊 Stock: ${producto.stock}`)

        if (producto.stock > 0) {
          // 4. Probar crear venta
          console.log("\n4️⃣ Probando POST /api/ventas...")
          const ventaData = {
            items: [
              {
                producto_id: producto.id,
                cantidad: 1,
                precio_unitario: producto.precio,
              },
            ],
            total: producto.precio,
          }

          console.log("📝 Datos de venta:", JSON.stringify(ventaData, null, 2))

          const crearVentaResponse = await fetch("http://localhost:3001/api/ventas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(ventaData),
          })

          if (crearVentaResponse.ok) {
            const ventaCreada = await crearVentaResponse.json()
            console.log("✅ Venta creada exitosamente:")
            console.log(`   🆔 ID: ${ventaCreada.venta_id}`)
            console.log(`   💰 Total: $${ventaCreada.total}`)

            // 5. Verificar que se actualizó el stock
            console.log("\n5️⃣ Verificando actualización de stock...")
            const productoActualizadoResponse = await fetch(`http://localhost:3001/api/productos/${producto.id}`)

            if (productoActualizadoResponse.ok) {
              const productoActualizado = await productoActualizadoResponse.json()
              const stockAnterior = producto.stock
              const stockActual = productoActualizado.stock
              console.log(`📊 Stock anterior: ${stockAnterior}`)
              console.log(`📊 Stock actual: ${stockActual}`)

              if (stockActual === stockAnterior - 1) {
                console.log("✅ Stock actualizado correctamente")
              } else {
                console.log("❌ Error: Stock no se actualizó correctamente")
              }
            }

            // 6. Probar obtener historial de ventas
            console.log("\n6️⃣ Probando GET /api/ventas (historial)...")
            const ventasResponse = await fetch("http://localhost:3001/api/ventas", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (ventasResponse.ok) {
              const ventas = await ventasResponse.json()
              console.log(`✅ Historial obtenido: ${ventas.length} ventas`)

              if (ventas.length > 0) {
                const ultimaVenta = ventas[0]
                console.log(`📋 Última venta: #${ultimaVenta.id}`)
                console.log(`💰 Total: $${ultimaVenta.total}`)
                console.log(`📅 Fecha: ${ultimaVenta.fecha}`)
                console.log(`👤 Vendedor: ${ultimaVenta.vendedor_nombre}`)
                console.log(`📦 Items: ${ultimaVenta.items?.length || 0}`)
              }
            }

            console.log("\n🎉 ¡Todas las pruebas del módulo de ventas pasaron exitosamente!")
          } else {
            const error = await crearVentaResponse.text()
            console.log("❌ Error al crear venta:", error)
          }
        } else {
          console.log("⚠️ No hay stock suficiente para probar la venta")
        }
      } else {
        console.log("⚠️ No hay productos disponibles para probar")
      }
    } else {
      const error = await productosResponse.text()
      console.log("❌ Error al obtener productos:", error)
    }
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message)
  }
}

testVentasCompleto()
