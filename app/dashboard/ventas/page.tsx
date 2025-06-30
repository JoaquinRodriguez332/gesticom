"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useColacionStatus } from "@/hooks/useColacionStatusº"
import { BloqueoColacion } from "@/components/bloqueo-colacion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Package,
  Scan,
  History,
  Printer,
  CheckCircle,
  Receipt,
} from "lucide-react"
import { toast } from "sonner"

interface Producto {
  id: number
  codigo: string
  nombre: string
  precio: number
  stock: number
  categoria?: string
}

interface ItemCarrito {
  producto: Producto
  cantidad: number
  subtotal: number
}

interface Venta {
  id: number
  total: number
  fecha: string
  usuario_id: number
  estado: string
  items: {
    producto_nombre: string
    cantidad: number
    precio_unitario: number
  }[]
}

const formatearPrecio = (precio: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio)
}

export default function VentasPage() {
  const { usuario, isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()
  const { enColacion, horaInicio } = useColacionStatus()

  const [productos, setProductos] = useState<Producto[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [codigoBarras, setCodigoBarras] = useState("")
  const [ventas, setVentas] = useState<Venta[]>([])
  const [vistaActual, setVistaActual] = useState<"venta" | "historial">("venta")
  const [cargando, setCargando] = useState(false)
  const [ventaCompletada, setVentaCompletada] = useState<any>(null)
  const [mostrarBoleta, setMostrarBoleta] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      cargarProductos()
      cargarVentas()
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !usuario) {
    return null
  }

  if (enColacion && horaInicio) {
    return <BloqueoColacion horaInicio={horaInicio} />
  }

  const cargarProductos = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/productos")
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast.error("Error al cargar productos")
    }
  }

  const cargarVentas = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("http://localhost:3001/api/ventas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVentas(data)
      }
    } catch (error) {
      console.error("Error al cargar ventas:", error)
    }
  }

  const buscarPorCodigo = async () => {
    if (!codigoBarras.trim()) return

    const producto = productos.find((p) => p.codigo === codigoBarras.trim())
    if (producto) {
      agregarAlCarrito(producto)
      setCodigoBarras("")
    } else {
      toast.error("Producto no encontrado")
    }
  }

  const productosFiltrados = productos.filter(
    (producto) => producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || producto.codigo.includes(busqueda),
  )

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) {
      toast.error("Producto sin stock")
      return
    }

    const itemExistente = carrito.find((item) => item.producto.id === producto.id)

    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.error("No hay suficiente stock")
        return
      }
      actualizarCantidad(producto.id, itemExistente.cantidad + 1)
    } else {
      const nuevoItem: ItemCarrito = {
        producto,
        cantidad: 1,
        subtotal: producto.precio,
      }
      setCarrito([...carrito, nuevoItem])
      toast.success(`${producto.nombre} agregado al carrito`)
    }
  }

  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId)
      return
    }

    const producto = productos.find((p) => p.id === productoId)
    if (producto && nuevaCantidad > producto.stock) {
      toast.error("No hay suficiente stock")
      return
    }

    setCarrito(
      carrito.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: item.producto.precio * nuevaCantidad,
            }
          : item,
      ),
    )
  }

  const eliminarDelCarrito = (productoId: number) => {
    setCarrito(carrito.filter((item) => item.producto.id !== productoId))
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0)
  }

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío")
      return
    }

    setCargando(true)
    try {
      const token = localStorage.getItem("auth_token")
      const ventaData = {
        items: carrito.map((item) => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio,
        })),
        total: calcularTotal(),
      }

      const response = await fetch("http://localhost:3001/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaData),
      })

      if (response.ok) {
        const result = await response.json()

        setVentaCompletada({
          id: result.venta_id,
          total: result.total,
          items: carrito,
          fecha: new Date(),
          vendedor: usuario?.nombre,
        })

        toast.success("¡Venta procesada exitosamente!")
        setCarrito([])
        cargarProductos()
        cargarVentas()
        setMostrarBoleta(true)
      } else {
        const error = await response.json()
        toast.error(error.message || "Error al procesar la venta")
      }
    } catch (error) {
      console.error("Error al procesar venta:", error)
      toast.error("Error al procesar la venta")
    } finally {
      setCargando(false)
    }
  }

  const imprimirBoleta = () => {
    if (!ventaCompletada) return

    const ventana = window.open("", "_blank")
    if (!ventana) return

    const contenidoBoleta = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boleta de Venta #${ventaCompletada.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 300px; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>GESTICOM</h2>
          <p>Boleta de Venta</p>
          <p>#${ventaCompletada.id}</p>
          <p>${ventaCompletada.fecha.toLocaleString("es-CL")}</p>
          <p>Vendedor: ${ventaCompletada.vendedor}</p>
        </div>
        
        <div class="items">
          ${ventaCompletada.items
            .map(
              (item) => `
            <div class="item">
              <span>${item.cantidad}x ${item.producto.nombre}</span>
              <span>${formatearPrecio(item.subtotal)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="total">
          <div class="item">
            <span>TOTAL:</span>
            <span>${formatearPrecio(ventaCompletada.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Conserve esta boleta</p>
        </div>
      </body>
      </html>
    `

    ventana.document.write(contenidoBoleta)
    ventana.document.close()
    ventana.print()
  }

  const anularVenta = async (ventaId: number) => {
    if (!hasRole("admin")) {
      toast.error("No tienes permisos para anular ventas")
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`http://localhost:3001/api/ventas/${ventaId}/anular`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Venta anulada exitosamente")
        cargarVentas()
        cargarProductos()
      } else {
        toast.error("Error al anular la venta")
      }
    } catch (error) {
      console.error("Error al anular venta:", error)
      toast.error("Error al anular la venta")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                <h1 className="text-lg font-semibold text-gray-900">Módulo de Ventas</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={vistaActual === "venta" ? "default" : "outline"}
                size="sm"
                onClick={() => setVistaActual("venta")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nueva Venta
              </Button>
              <Button
                variant={vistaActual === "historial" ? "default" : "outline"}
                size="sm"
                onClick={() => setVistaActual("historial")}
              >
                <History className="h-4 w-4 mr-2" />
                Historial
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {vistaActual === "venta" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-medium">
                    <Scan className="h-4 w-4 mr-2" />
                    Escáner de Código de Barras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Escanea o ingresa el código de barras"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && buscarPorCodigo()}
                      className="h-9"
                    />
                    <Button onClick={buscarPorCodigo} size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-medium">
                    <Package className="h-4 w-4 mr-2" />
                    Catálogo de Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="mb-4 h-9"
                  />

                  <div className="h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {productosFiltrados.map((producto) => (
                        <div
                          key={producto.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => agregarAlCarrito(producto)}
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{producto.nombre}</h3>
                            <p className="text-xs text-gray-500 font-mono">Código: {producto.codigo}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-semibold text-gray-900">
                                {formatearPrecio(producto.precio)}
                              </span>
                              <Badge
                                variant={
                                  producto.stock > 10 ? "default" : producto.stock > 0 ? "secondary" : "destructive"
                                }
                                className="text-xs"
                              >
                                Stock: {producto.stock}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" disabled={producto.stock <= 0} className="ml-2">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base font-medium">
                    <span className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Carrito de Compras
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {carrito.length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrito.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">El carrito está vacío</p>
                    </div>
                  ) : (
                    <div className="h-64 overflow-y-auto">
                      <div className="space-y-3">
                        {carrito.map((item) => (
                          <div key={item.producto.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm flex-1 mr-2">{item.producto.nombre}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarDelCarrito(item.producto.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-6 text-center">{item.cantidad}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-semibold text-sm">{formatearPrecio(item.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {carrito.length > 0 && (
                    <>
                      <div className="my-4 border-t" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-lg font-bold bg-gray-50 p-3 rounded-lg">
                          <span>TOTAL:</span>
                          <span>{formatearPrecio(calcularTotal())}</span>
                        </div>
                        <Button className="w-full h-10" onClick={procesarVenta} disabled={cargando}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          {cargando ? "Procesando..." : "Procesar Venta"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-medium">
                <History className="h-4 w-4 mr-2" />
                Historial de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto">
                <div className="space-y-4">
                  {ventas.map((venta) => (
                    <div key={venta.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">Venta #{venta.id}</h3>
                          <p className="text-xs text-gray-500">{new Date(venta.fecha).toLocaleString("es-CL")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatearPrecio(venta.total)}</p>
                          <Badge variant={venta.estado === "activa" ? "default" : "destructive"} className="text-xs">
                            {venta.estado}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3 text-sm">
                        {venta.items?.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {item.cantidad}x {item.producto_nombre}
                            </span>
                            <span>{formatearPrecio(item.cantidad * item.precio_unitario)}</span>
                          </div>
                        ))}
                      </div>

                      {hasRole("admin") && venta.estado === "activa" && (
                        <Button variant="destructive" size="sm" onClick={() => anularVenta(venta.id)}>
                          Anular Venta
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal de boleta - usando DialogContent correcto */}
      <Dialog open={mostrarBoleta} onOpenChange={setMostrarBoleta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              Venta Completada
            </DialogTitle>
          </DialogHeader>

          {ventaCompletada && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-1">Venta #{ventaCompletada.id}</h3>
                <p className="text-2xl font-bold text-green-700">{formatearPrecio(ventaCompletada.total)}</p>
                <p className="text-xs text-gray-600 mt-1">{ventaCompletada.fecha.toLocaleString("es-CL")}</p>
              </div>

              <div className="space-y-2">
                <Button onClick={imprimirBoleta} className="w-full" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Boleta
                </Button>

                <Button onClick={() => setMostrarBoleta(false)} variant="outline" className="w-full" size="sm">
                  <Receipt className="h-4 w-4 mr-2" />
                  Continuar Vendiendo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
