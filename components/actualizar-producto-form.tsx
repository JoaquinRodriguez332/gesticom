"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Save, X } from "lucide-react"
import { productosApi, type Producto, type UpdateProductoData, ApiError } from "@/lib/api"

interface Props {
  producto: Producto
  onProductoActualizado: () => void
  onClose: () => void
}

const ActualizarProductoForm: React.FC<Props> = ({ producto, onProductoActualizado, onClose }) => {
  const [form, setForm] = useState<UpdateProductoData>({
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    stock: producto.stock,
    categoria: producto.categoria,
    proveedor: producto.proveedor,
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
      await productosApi.update(producto.id, form)

      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado exitosamente.",
      })

      onProductoActualizado()
    } catch (error) {
      console.error("Error al actualizar producto:", error)

      let errorMessage = "No se pudo actualizar el producto. Inténtalo de nuevo."

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
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center space-x-2">
          <Edit className="h-5 w-5 text-primary" />
          <DialogTitle>Editar Producto</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Producto</Label>
            <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Input id="categoria" name="categoria" value={form.categoria} onChange={handleChange} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} />
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
              value={form.stock || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input id="proveedor" name="proveedor" value={form.proveedor} onChange={handleChange} required />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ActualizarProductoForm
