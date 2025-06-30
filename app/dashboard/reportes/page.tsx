"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Package, DollarSign, AlertTriangle, Download, Calendar, BarChart3 } from "lucide-react"

interface VentaReporte {
  id: number
  fecha: string
  total: number
  usuario_id: number
  vendedor_nombre: string
  items: any[]
}

interface ProductoInventario {
  id: number
  codigo: string
  nombre: string
  stock: number
  precio: number
  categoria: string
  proveedor: string
  valor_total: number
}

interface ProductoStockCritico {
  id: number
  nombre: string
  codigo: string
  stock: number
  categoria: string
  proveedor: string
}

// Función para formatear números en formato chileno (CLP)
const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Función para formatear números sin símbolo de moneda
const formatNumber = (number: number): string => {
  return new Intl.NumberFormat("es-CL").format(number)
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function ReportesPage() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [periodo, setPeriodo] = useState("30")

  // Estados para los datos reales
  const [ventasData, setVentasData] = useState<VentaReporte[]>([])
  const [inventarioData, setInventarioData] = useState<ProductoInventario[]>([])
  const [stockCriticoData, setStockCriticoData] = useState<ProductoStockCritico[]>([])
  const [notificacionesData, setNotificacionesData] = useState<any[]>([])

  // KPIs calculados con datos reales
  const [kpis, setKpis] = useState({
    ventas_totales: 0,
    productos_vendidos: 0,
    valor_inventario: 0,
    productos_criticos: 0,
    crecimiento_ventas: 0,
    total_productos: 0,
  })

  useEffect(() => {
    // Establecer fechas por defecto
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

    setFechaFin(hoy.toISOString().split("T")[0])
    setFechaInicio(hace30Dias.toISOString().split("T")[0])

    fetchReportes()
  }, [token])

  const fetchReportes = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      console.log("🔄 Cargando datos de reportes...")

      // Obtener datos reales de tu backend
      const [productosRes, ventasRes, notificacionesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/productos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/ventas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/notificaciones`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!productosRes.ok || !ventasRes.ok || !notificacionesRes.ok) {
        throw new Error("Error al obtener datos del servidor")
      }

      const productos = await productosRes.json()
      const ventas = await ventasRes.json()
      const notificaciones = await notificacionesRes.json()

      console.log("📦 Productos obtenidos:", productos.length)
      console.log("💰 Ventas obtenidas:", ventas.length)
      console.log("🔔 Notificaciones obtenidas:", notificaciones.length)

      // Procesar productos para inventario
      const inventarioProcesado = productos.map((producto: any) => ({
        ...producto,
        valor_total: producto.precio * producto.stock,
      }))

      // Filtrar productos con stock crítico (≤ 5)
      const stockCritico = productos.filter((producto: any) => producto.stock <= 5)

      // Calcular KPIs reales
      const ventasTotales = ventas.reduce((sum: number, venta: any) => sum + Number.parseFloat(venta.total || 0), 0)
      const productosVendidos = ventas.reduce((sum: number, venta: any) => {
        return sum + (venta.items ? venta.items.reduce((itemSum: number, item: any) => itemSum + item.cantidad, 0) : 0)
      }, 0)
      const valorInventario = inventarioProcesado.reduce((sum: number, producto: any) => sum + producto.valor_total, 0)
      const notificacionesActivas = notificaciones.filter((n: any) => n.estado === "activa").length

      setInventarioData(inventarioProcesado)
      setVentasData(ventas)
      setStockCriticoData(stockCritico)
      setNotificacionesData(notificaciones)

      setKpis({
        ventas_totales: ventasTotales,
        productos_vendidos: productosVendidos,
        valor_inventario: valorInventario,
        productos_criticos: stockCritico.length,
        crecimiento_ventas: 0, // Calcular comparando con período anterior
        total_productos: productos.length,
      })

      console.log("✅ KPIs calculados:", {
        ventas_totales: ventasTotales,
        productos_vendidos: productosVendidos,
        valor_inventario: valorInventario,
        productos_criticos: stockCritico.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar reportes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportarReporte = (tipo: string) => {
    console.log(`📄 Exportando reporte: ${tipo}`)
    // Implementar exportación real
  }

  // Procesar datos para gráficos
  const ventasPorDia = ventasData.reduce((acc: any[], venta: any) => {
    const fecha = new Date(venta.fecha).toLocaleDateString("es-CL", { month: "short", day: "numeric" })
    const existingDay = acc.find((item) => item.fecha === fecha)

    if (existingDay) {
      existingDay.ventas += Number.parseFloat(venta.total || 0)
      existingDay.cantidad += venta.items ? venta.items.length : 1
    } else {
      acc.push({
        fecha,
        ventas: Number.parseFloat(venta.total || 0),
        cantidad: venta.items ? venta.items.length : 1,
      })
    }
    return acc
  }, [])

  // Agrupar inventario por categoría
  const inventarioPorCategoria = inventarioData.reduce(
    (acc: any, producto: any) => {
      const categoria = producto.categoria || "Sin Categoría"
      if (!acc[categoria]) {
        acc[categoria] = { categoria, valor: 0, cantidad: 0 }
      }
      acc[categoria].valor += producto.valor_total
      acc[categoria].cantidad += producto.stock
      return acc
    },
    {} as Record<string, { categoria: string; valor: number; cantidad: number }>,
  )

  const categoriasData = Object.values(inventarioPorCategoria)

  // Agrupar ventas por vendedor
  const ventasPorVendedor = ventasData.reduce((acc: any, venta: any) => {
    const vendedor = venta.vendedor_nombre || "Sin Asignar"
    if (!acc[vendedor]) {
      acc[vendedor] = { vendedor, total: 0, cantidad: 0 }
    }
    acc[vendedor].total += Number.parseFloat(venta.total || 0)
    acc[vendedor].cantidad += venta.items ? venta.items.reduce((sum: number, item: any) => sum + item.cantidad, 0) : 1
    return acc
  }, {})

  const vendedoresData = Object.values(ventasPorVendedor).sort((a: any, b: any) => b.total - a.total)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600">Análisis y estadísticas del negocio</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => exportarReporte("completo")}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Todo
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Filtros de Período</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="periodo">Período Rápido</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fecha-fin">Fecha Fin</Label>
                <Input id="fecha-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchReportes} className="w-full">
                  Actualizar Reportes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principales con datos reales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-green-600">{formatCLP(kpis.ventas_totales)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">{ventasData.length} ventas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-blue-600">{kpis.productos_vendidos}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">De {kpis.total_productos} productos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCLP(kpis.valor_inventario)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Valor total en stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                  <p className="text-2xl font-bold text-red-600">{kpis.productos_criticos}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-sm text-red-500 mt-2">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Reportes */}
        <Tabs defaultValue="ventas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ventas">📊 Reporte de Ventas</TabsTrigger>
            <TabsTrigger value="inventario">📦 Reporte de Inventario</TabsTrigger>
            <TabsTrigger value="stock">⚠️ Stock Crítico</TabsTrigger>
          </TabsList>

          {/* Reporte de Ventas */}
          <TabsContent value="ventas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Ventas por Día */}
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Día</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportarReporte("ventas")} className="w-fit">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </CardHeader>
                <CardContent>
                  {ventasPorDia.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ventasPorDia}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${formatCLP(value)}`, "Ventas"]} />
                        <Bar dataKey="ventas" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay datos de ventas para mostrar</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Vendedores */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Vendedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendedoresData.length > 0 ? (
                      vendedoresData.map((vendedor: any, index: number) => (
                        <div
                          key={vendedor.vendedor}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{vendedor.vendedor}</p>
                            <p className="text-sm text-gray-600">{vendedor.cantidad} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCLP(vendedor.total)}</p>
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {index === 0 ? "🏆 Top" : `#${index + 1}`}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay datos de vendedores disponibles</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla Detallada de Ventas */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Vendedor</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-right p-2">Items</th>
                        <th className="text-center p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasData.length > 0 ? (
                        ventasData.map((venta) => (
                          <tr key={venta.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">#{venta.id}</td>
                            <td className="p-2">{new Date(venta.fecha).toLocaleDateString("es-CL")}</td>
                            <td className="p-2">{venta.vendedor_nombre || "Sin asignar"}</td>
                            <td className="p-2 text-right font-medium">
                              {formatCLP(Number.parseFloat(venta.total || 0))}
                            </td>
                            <td className="p-2 text-right">{venta.items ? venta.items.length : 0}</td>
                            <td className="p-2 text-center">
                              <Badge variant="default">Activa</Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No hay ventas registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporte de Inventario */}
          <TabsContent value="inventario" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Inventario por Categoría */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventario por Categoría</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportarReporte("inventario")} className="w-fit">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </CardHeader>
                <CardContent>
                  {categoriasData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoriasData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ categoria, valor }) => `${categoria}: ${formatCLP(valor)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="valor"
                        >
                          {categoriasData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${formatCLP(value)}`, "Valor"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay datos de inventario para mostrar</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Productos con Mayor Valor */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos con Mayor Valor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventarioData
                      .sort((a, b) => b.valor_total - a.valor_total)
                      .slice(0, 5)
                      .map((producto, index) => (
                        <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{producto.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {producto.stock} unidades • {producto.categoria}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">{formatCLP(producto.valor_total)}</p>
                            <p className="text-sm text-gray-500">{formatCLP(producto.precio)} c/u</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Inventario */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Código</th>
                        <th className="text-left p-2">Producto</th>
                        <th className="text-left p-2">Categoría</th>
                        <th className="text-right p-2">Stock</th>
                        <th className="text-right p-2">Precio Unit.</th>
                        <th className="text-right p-2">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventarioData.map((producto) => (
                        <tr key={producto.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-sm">{producto.codigo}</td>
                          <td className="p-2 font-medium">{producto.nombre}</td>
                          <td className="p-2">
                            <Badge variant="outline">{producto.categoria}</Badge>
                          </td>
                          <td className="p-2 text-right">{producto.stock}</td>
                          <td className="p-2 text-right">{formatCLP(producto.precio)}</td>
                          <td className="p-2 text-right font-medium">{formatCLP(producto.valor_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporte de Stock Crítico */}
          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>Productos con Stock Crítico</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => exportarReporte("stock-critico")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockCriticoData.length > 0 ? (
                    stockCriticoData.map((producto) => (
                      <div
                        key={producto.id}
                        className={`p-4 rounded-lg border-2 ${
                          producto.stock === 0 ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{producto.stock === 0 ? "🚫" : "⚠️"}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                              <p className="text-sm text-gray-600">
                                Código: {producto.codigo} • {producto.categoria}
                              </p>
                              <p className="text-xs text-gray-500">Proveedor: {producto.proveedor}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge variant={producto.stock === 0 ? "destructive" : "secondary"} className="mb-2">
                              {producto.stock === 0 ? "Sin Stock" : "Stock Crítico"}
                            </Badge>
                            <p className="text-sm text-gray-600">{producto.stock} unidades</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">¡Excelente!</h3>
                      <p>No hay productos con stock crítico en este momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
