"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Package, Plus } from "lucide-react"
import { productosApi, type CreateProductoData, ApiError } from "@/lib/api"

interface Props {
  onProductoAgregado: () => void
}

const CrearProductoForm: React.FC<Props> = ({ onProductoAgregado }) => {
  const [form, setForm] = useState<CreateProductoData>({
    codigo: "",
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    categoria: "",
    proveedor: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "precio" || name === "stock" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await productosApi.create(form)

      toast({
        title: "Producto creado",
        description: "El producto se ha agregado exitosamente al inventario.",
      })

      onProductoAgregado()
      setForm({
        codigo: "",
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        categoria: "",
        proveedor: "",
      })
    } catch (error) {
      console.error("Error al crear producto:", error)

      let errorMessage = "No se pudo crear el producto. Inténtalo de nuevo."

      if (error instanceof ApiError) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Nuevo Producto</CardTitle>
        </div>
        <CardDescription>Agrega un nuevo producto al inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Barras</Label>
              <Input
                id="codigo"
                name="codigo"
                placeholder="Ej: 123456789"
                value={form.codigo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Laptop Dell XPS"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Descripción detallada del producto..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio ($)</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.precio || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                placeholder="0"
                value={form.stock || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                name="categoria"
                placeholder="Ej: Electrónicos"
                value={form.categoria}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              name="proveedor"
              placeholder="Nombre del proveedor"
              value={form.proveedor}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Producto
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CrearProductoForm
