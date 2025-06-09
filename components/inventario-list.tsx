"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Search, Edit, Trash2, Package, DollarSign, Hash, Building, Tag, AlertCircle } from "lucide-react"
import ActualizarProductoForm from "./actualizar-producto-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { productosApi, type Producto, ApiError } from "@/lib/api"

interface Props {
  reload: boolean
}

const InventarioList: React.FC<Props> = ({ reload }) => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null)
  const [productoEliminar, setProductoEliminar] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProductos = async (searchTerm?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await productosApi.getAll(searchTerm)
      setProductos(data)
    } catch (error) {
      console.error("Error al cargar productos:", error)

      let errorMessage = "No se pudieron cargar los productos."

      if (error instanceof ApiError) {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [reload])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busqueda.trim()) {
        fetchProductos(busqueda)
      } else {
        fetchProductos()
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [busqueda])

  const handleEliminar = async () => {
    if (productoEliminar !== null) {
      try {
        await productosApi.delete(productoEliminar)

        setProductos(productos.filter((p) => p.id !== productoEliminar))
        toast({
          title: "Producto eliminado",
          description: "El producto se ha eliminado exitosamente.",
        })
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
        setProductoEliminar(null)
      }
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

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-32 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="text-lg font-semibold">Error al cargar productos</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => fetchProductos()} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Inventario de Productos</CardTitle>
            </div>
            <Badge variant="outline" className="text-sm">
              {productos.length} productos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            {productos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              productos.map((producto) => (
                <Card key={producto.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{producto.nombre}</h3>
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

                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => setProductoEditar(producto)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductoEliminar(producto.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={!!productoEditar} onOpenChange={() => setProductoEditar(null)}>
        <DialogContent className="max-w-2xl">
          {productoEditar && (
            <ActualizarProductoForm
              producto={productoEditar}
              onProductoActualizado={() => {
                fetchProductos(busqueda)
                setProductoEditar(null)
              }}
              onClose={() => setProductoEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={!!productoEliminar} onOpenChange={() => setProductoEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default InventarioList
