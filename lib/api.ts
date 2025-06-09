const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export interface Producto {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  proveedor: string
  fecha_registro: string
  created_at: string
  updated_at: string
}

export interface CreateProductoData {
  codigo: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  proveedor: string
}

export interface UpdateProductoData {
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  proveedor: string
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
      throw new ApiError(response.status, errorData.error || `Error ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Error de red o conexión
    throw new ApiError(0, "Error de conexión. Verifica que el servidor esté funcionando.")
  }
}

// Función helper para asegurar tipos correctos
export const normalizeProducto = (producto: any): Producto => ({
  ...producto,
  id: Number(producto.id),
  precio: Number(producto.precio),
  stock: Number(producto.stock),
})

export const productosApi = {
  // Obtener todos los productos
  getAll: async (search?: string): Promise<Producto[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    return fetchApi<Producto[]>(`/productos${params}`)
  },

  // Obtener un producto por ID
  getById: async (id: number): Promise<Producto> => {
    return fetchApi<Producto>(`/productos/${id}`)
  },

  // Crear un nuevo producto
  create: async (data: CreateProductoData): Promise<Producto> => {
    return fetchApi<Producto>("/productos", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Actualizar un producto
  update: async (id: number, data: UpdateProductoData): Promise<Producto> => {
    return fetchApi<Producto>(`/productos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Eliminar un producto
  delete: async (id: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/productos/${id}`, {
      method: "DELETE",
    })
  },

  // Buscar productos por código o nombre
  searchByTerm: async (termino: string): Promise<Producto[]> => {
    const productos = await fetchApi<any[]>(`/productos/buscar/${encodeURIComponent(termino)}`)
    return productos.map(normalizeProducto)
  },

  // Verificar salud del servidor
  health: async (): Promise<{ status: string; timestamp: string }> => {
    return fetchApi<{ status: string; timestamp: string }>("/health")
  },
}

export { ApiError }
