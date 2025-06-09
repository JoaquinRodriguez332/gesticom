"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Package } from "lucide-react"
import CrearProductoForm from "@/components/crear-producto-form"
import InventarioList from "@/components/inventario-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function InventarioPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [mostrarCrearForm, setMostrarCrearForm] = useState(false)
  const [reloadList, setReloadList] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleProductoAgregado = () => {
    setReloadList(!reloadList)
    setMostrarCrearForm(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>

              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 rounded-lg p-2">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Inventario</h1>
                  <p className="text-xs text-gray-500">Gestión de productos</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setMostrarCrearForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <InventarioList reload={reloadList} />
      </main>

      {/* Modal para crear producto */}
      <Dialog open={mostrarCrearForm} onOpenChange={setMostrarCrearForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader>
          <CrearProductoForm onProductoAgregado={handleProductoAgregado} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
