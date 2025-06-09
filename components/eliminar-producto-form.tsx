"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, AlertTriangle, Search, Package, DollarSign, Hash, Building, Tag } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { productosApi, type Producto, ApiError } from "@/lib/api"

interface Props {
  onProductoEliminado: () => void
}

const EliminarProductoForm: React.FC<Props> = ({ onProductoEliminado }) => {
  const [termino, setTermino] = useState("")
  const [productosEncontrados, setProductosEncontrados] = useState<Producto[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const buscarProducto = async () => {
    if (!termino.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código o nombre para buscar.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setProductosEncontrados([])
    setProductoSeleccionado(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/productos/buscar/${encodeURIComponent(termino)}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al buscar producto")
      }

      const productos = await response.json()
      setProductosEncontrados(productos)

      if (productos.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron productos con ese código o nombre.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al buscar producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al buscar el producto.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto)
  }

  const eliminarProducto = async () => {
    if (!productoSeleccionado) return

    setIsDeleting(true)

    try {
      await productosApi.delete(productoSeleccionado.id)

      toast({
        title: "Producto eliminado",
        description: `El producto "${productoSeleccionado.nombre}" se ha eliminado exitosamente.`,
      })

      onProductoEliminado()
      setTermino("")
      setProductosEncontrados([])
      setProductoSeleccionado(null)
    } catch (error) {
      console.error("Error al eliminar producto:", error)

      let errorMessage = "No se pudo eliminar el producto."

      if (error instanceof ApiError) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStockColor = (stock: number) => {
    if (stock <= 5) return "destructive"
    if (stock <= 15) return "secondary"
    return "default"
  }

  const getStockText = (stock: number) => {
    if (stock <= 5) return "Stock Bajo"
    if (stock <= 15) return "Stock Medio"
    return "Stock Alto"
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      buscarProducto()
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <CardTitle className="text-xl">Eliminar Producto</CardTitle>
        </div>
        <CardDescription>Busca un producto por código o nombre para eliminarlo del inventario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Búsqueda */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="termino">Código de barras o nombre del producto</Label>
              <Input
                id="termino"
                placeholder="Ej: 123456789 o Laptop Dell"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={buscarProducto} disabled={isSearching || !termino.trim()}>
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {productosEncontrados.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Productos encontrados:</h3>
            <div className="grid gap-3">
              {productosEncontrados.map((producto) => (
                <Card
                  key={producto.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    productoSeleccionado?.id === producto.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => seleccionarProducto(producto)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{producto.nombre}</h4>
                          <Badge variant={getStockColor(producto.stock)}>{getStockText(producto.stock)}</Badge>
                        </div>

                        <p className="text-muted-foreground text-sm">{producto.descripcion}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span>{producto.codigo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${Number(producto.precio).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span>{producto.stock} unidades</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{producto.categoria}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{producto.proveedor}</span>
                          </div>
                        </div>
                      </div>

                      {productoSeleccionado?.id === producto.id && (
                        <div className="ml-4">
                          <Badge variant="default">Seleccionado</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Advertencia y botón de eliminación */}
        {productoSeleccionado && (
          <div className="space-y-4">
            <div className="flex items-start space-x-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">
                <p className="font-medium">⚠️ Advertencia</p>
                <p>
                  Estás a punto de eliminar el producto <strong>"{productoSeleccionado.nombre}"</strong> con código{" "}
                  <strong>{productoSeleccionado.codigo}</strong>.
                </p>
                <p className="mt-1">
                  Esta acción no se puede deshacer y el producto será eliminado permanentemente del inventario.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Producto Seleccionado
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Estás a punto de eliminar el siguiente producto:</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p>
                        <strong>Nombre:</strong> {productoSeleccionado.nombre}
                      </p>
                      <p>
                        <strong>Código:</strong> {productoSeleccionado.codigo}
                      </p>
                      <p>
                        <strong>Stock actual:</strong> {productoSeleccionado.stock} unidades
                      </p>
                      <p>
                        <strong>Precio:</strong> ${Number(productoSeleccionado.precio).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-destructive font-medium">Esta acción no se puede deshacer.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={eliminarProducto}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Eliminando...
                      </>
                    ) : (
                      "Sí, eliminar producto"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Mensaje cuando no hay productos encontrados después de buscar */}
        {termino && productosEncontrados.length === 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron productos con el término "{termino}"</p>
            <p className="text-sm">Intenta con otro código o nombre</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EliminarProductoForm
