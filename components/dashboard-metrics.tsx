"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Package, AlertTriangle, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Metricas {
  productos_total: number
  productos_stock_bajo: number
  productos_sin_stock: number
  notificaciones_activas: number
  ventas_hoy: number
  valor_inventario: number
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  stock: number
  categoria: string
  proveedor: string
  precio: number
}

const DashboardMetrics: React.FC = () => {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [productosStockBajo, setProductosStockBajo] = useState<Producto[]>([])
  const [productosSinStock, setProductosSinStock] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalStockBajo, setModalStockBajo] = useState(false)
  const [modalSinStock, setModalSinStock] = useState(false)
  const { token } = useAuth()
  const router = useRouter()

  const fetchMetricas = async () => {
    if (!token) return

    try {
      // Obtener productos
      const productosRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Obtener notificaciones
      const notificacionesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/notificaciones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (productosRes.ok && notificacionesRes.ok) {
        const productos = await productosRes.json()
        const notificaciones = await notificacionesRes.json()

        // Filtrar productos por stock
        const stockBajo = productos.filter((p: any) => p.stock <= 5 && p.stock > 0)
        const sinStock = productos.filter((p: any) => p.stock === 0)
        const valorInventario = productos.reduce((sum: number, p: any) => sum + p.precio * p.stock, 0)

        setProductosStockBajo(stockBajo)
        setProductosSinStock(sinStock)

        setMetricas({
          productos_total: productos.length,
          productos_stock_bajo: stockBajo.length,
          productos_sin_stock: sinStock.length,
          notificaciones_activas: notificaciones.filter((n: any) => n.estado === "activa").length,
          ventas_hoy: 0, // Implementar si tienes endpoint de ventas
          valor_inventario: valorInventario,
        })
      }
    } catch (error) {
      console.error("Error al cargar métricas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetricas()
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchMetricas, 300000)
    return () => clearInterval(interval)
  }, [token])

  const handleVerInventario = () => {
    router.push("/dashboard/inventario")
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { color: "destructive", text: "Sin Stock", icon: "🚫" }
    } else if (stock <= 2) {
      return { color: "destructive", text: "Stock Crítico", icon: "⚠️" }
    } else {
      return { color: "secondary", text: "Stock Bajo", icon: "📦" }
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metricas) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Productos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricas.productos_total}</div>
          <p className="text-xs text-muted-foreground">En inventario</p>
        </CardContent>
      </Card>

      {/* Stock Bajo - Clickeable */}
      <Dialog open={modalStockBajo} onOpenChange={setModalStockBajo}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metricas.productos_stock_bajo}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Productos con Stock Bajo</span>
            </DialogTitle>
            <DialogDescription>Productos que requieren reposición (stock ≤ 5 unidades)</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {productosStockBajo.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>¡Excelente! No hay productos con stock bajo</p>
              </div>
            ) : (
              productosStockBajo.map((producto) => {
                const status = getStockStatus(producto.stock)
                return (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{status.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          Código: {producto.codigo} • {producto.categoria}
                        </p>
                        <p className="text-xs text-gray-500">Proveedor: {producto.proveedor}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={status.color as any} className="mb-1">
                        {status.text}
                      </Badge>
                      <p className="text-sm text-gray-600">{producto.stock} unidades</p>
                      <p className="text-xs text-gray-500">${producto.precio.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalStockBajo(false)}>
              Cerrar
            </Button>
            <Button onClick={handleVerInventario} className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>Ver en Inventario</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sin Stock - Clickeable */}
      <Dialog open={modalSinStock} onOpenChange={setModalSinStock}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metricas.productos_sin_stock}</div>
              <p className="text-xs text-muted-foreground">Productos agotados</p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span>Productos Sin Stock</span>
            </DialogTitle>
            <DialogDescription>Productos completamente agotados que necesitan reposición urgente</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {productosSinStock.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>¡Perfecto! No hay productos sin stock</p>
              </div>
            ) : (
              productosSinStock.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🚫</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                      <p className="text-sm text-gray-600">
                        Código: {producto.codigo} • {producto.categoria}
                      </p>
                      <p className="text-xs text-gray-500">Proveedor: {producto.proveedor}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      Sin Stock
                    </Badge>
                    <p className="text-sm text-gray-600">0 unidades</p>
                    <p className="text-xs text-gray-500">${producto.precio.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalSinStock(false)}>
              Cerrar
            </Button>
            <Button onClick={handleVerInventario} className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>Ver en Inventario</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notificaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{metricas.notificaciones_activas}</div>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardMetrics
