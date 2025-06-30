"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ProductoStockBajo {
  id: number
  codigo: string
  nombre: string
  stock: number
  categoria: string
  proveedor: string
}

const StockAlerts: React.FC = () => {
  const [productos, setProductos] = useState<ProductoStockBajo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useAuth()

  const fetchProductosStockBajo = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/productos?stock_bajo=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        // Filtrar productos con stock <= 5
        const productosStockBajo = data.filter((p: any) => p.stock <= 5)
        setProductos(productosStockBajo)
      }
    } catch (error) {
      console.error("Error al cargar productos con stock bajo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductosStockBajo()
  }, [token])

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { color: "destructive", text: "Sin Stock", icon: "🚫" }
    } else if (stock <= 2) {
      return { color: "destructive", text: "Stock Crítico", icon: "⚠️" }
    } else {
      return { color: "secondary", text: "Stock Bajo", icon: "📦" }
    }
  }

  if (productos.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-800">Alertas de Stock</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-white">
              {productos.length} productos
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchProductosStockBajo} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {productos.slice(0, 5).map((producto) => {
              const status = getStockStatus(producto.stock)
              return (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{status.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                      <p className="text-sm text-gray-600">
                        Código: {producto.codigo} • {producto.categoria}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={status.color as any} className="mb-1">
                      {status.text}
                    </Badge>
                    <p className="text-sm text-gray-600">{producto.stock} unidades</p>
                  </div>
                </div>
              )
            })}
            {productos.length > 5 && (
              <p className="text-center text-sm text-gray-500 pt-2">
                Y {productos.length - 5} productos más con stock bajo
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StockAlerts
