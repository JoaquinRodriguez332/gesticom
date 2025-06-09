"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  X,
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

export default function VentasPage() {
  const { usuario, isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()

  // Estados principales
  const [productos, setProductos] = useState<Producto[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [codigoBarras, setCodigoBarras] = useState("")
  const [ventas, setVentas] = useState<Venta[]>([])
  const [vistaActual, setVistaActual] = useState<"venta" | "historial">("venta")
  const [cargando, setCargando] = useState(false)

  // Verificar autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Cargar productos
  useEffect(() => {
    if (isAuthenticated) {
      cargarProductos()
      cargarVentas()
    }
  }, [isAuthenticated])

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
      const token = localStorage.getItem("token")
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

  // Buscar producto por código de barras
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

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(
    (producto) => producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || producto.codigo.includes(busqueda),
  )

  // Agregar producto al carrito
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

  // Actualizar cantidad en carrito
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

  // Eliminar del carrito
  const eliminarDelCarrito = (productoId: number) => {
    setCarrito(carrito.filter((item) => item.producto.id !== productoId))
  }

  // Calcular total
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0)
  }

  // Procesar venta
  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío")
      return
    }

    setCargando(true)
    try {
      const token = localStorage.getItem("token")
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
        toast.success("Venta procesada exitosamente")
        setCarrito([])
        cargarProductos() // Actualizar stock
        cargarVentas() // Actualizar historial
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

  // Anular venta (solo dueños)
  const anularVenta = async (ventaId: number) => {
    if (!hasRole("dueño")) {
      toast.error("No tienes permisos para anular ventas")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/ventas/${ventaId}/anular`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Venta anulada exitosamente")
        cargarVentas()
        cargarProductos() // Actualizar stock
      } else {
        toast.error("Error al anular la venta")
      }
    } catch (error) {
      console.error("Error al anular venta:", error)
      toast.error("Error al anular la venta")
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Módulo de Ventas</h1>
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
            {/* Panel de búsqueda y productos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Búsqueda por código de barras */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="h-5 w-5 mr-2" />
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
                    />
                    <Button onClick={buscarPorCodigo}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Búsqueda de productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Buscar Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="mb-4"
                  />

                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {productosFiltrados.map((producto) => (
                        <div
                          key={producto.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => agregarAlCarrito(producto)}
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">{producto.nombre}</h3>
                            <p className="text-sm text-gray-500">Código: {producto.codigo}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-lg font-bold text-green-600">${typeof producto.precio === "number" ? producto.precio.toFixed(2) : Number(producto.precio || 0).toFixed(2)}
</span>
                              <Badge variant={producto.stock > 0 ? "secondary" : "destructive"}>
                                Stock: {producto.stock}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" disabled={producto.stock <= 0}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Carrito de compras */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Carrito ({carrito.length})
                    </span>
                    {carrito.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setCarrito([])}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrito.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">El carrito está vacío</p>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {carrito.map((item) => (
                          <div key={item.producto.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{item.producto.nombre}</h4>
                              <Button variant="ghost" size="sm" onClick={() => eliminarDelCarrito(item.producto.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.cantidad}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold">
  ${item.subtotal ? Number(item.subtotal).toFixed(2) : "0.00"}
</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {carrito.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>${Number(calcularTotal() || 0).toFixed(2)}</span>
                        </div>
                        <Button className="w-full" onClick={procesarVenta} disabled={cargando}>
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
          /* Historial de ventas */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historial de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {ventas.map((venta) => (
                    <div key={venta.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Venta #{venta.id}</h3>
                          <p className="text-sm text-gray-500">{new Date(venta.fecha).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${venta.total.toFixed(2)}</p>
                          <Badge variant={venta.estado === "activa" ? "default" : "destructive"}>{venta.estado}</Badge>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        {venta.items?.map((item, index) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>
                              {item.cantidad}x {item.producto_nombre}
                            </span>
                            <span>${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {hasRole("dueño") && venta.estado === "activa" && (
                        <Button variant="destructive" size="sm" onClick={() => anularVenta(venta.id)}>
                          Anular Venta
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
