# Backend - Sistema de Inventario MySQL

Backend para el sistema de gestión de inventario usando MySQL.

## 🚀 Configuración

### 1. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 2. Configurar base de datos

1. Crea la base de datos MySQL ejecutando el archivo `gesticom_esquema_completo.sql`
2. Copia el archivo `.env.example` a `.env`
3. Configura las variables de entorno en `.env`:

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestioncom_inventario
PORT=3001
\`\`\`

### 3. Iniciar el servidor

**Desarrollo:**
\`\`\`bash
npm run dev
\`\`\`

**Producción:**
\`\`\`bash
npm start
\`\`\`

## 📡 Endpoints disponibles

### Productos
- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos/:id` - Obtener producto por ID
- `POST /api/productos` - Crear nuevo producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Estadísticas
- `GET /api/estadisticas` - Obtener estadísticas del inventario
- `GET /api/productos/stock-bajo` - Productos con stock bajo

### Sistema
- `GET /api/health` - Estado del servidor y base de datos

## 🗄️ Estructura de la base de datos

La aplicación usa las siguientes tablas principales:
- `productos` - Información de productos
- `categorias` - Categorías de productos (futuro)
- `proveedores` - Información de proveedores (futuro)
- `movimientos_inventario` - Historial de movimientos (futuro)

## 🔧 Características

- ✅ Pool de conexiones MySQL
- ✅ Manejo de errores robusto
- ✅ Validaciones de datos
- ✅ Búsqueda en tiempo real
- ✅ Estadísticas del inventario
- ✅ Detección de stock bajo
- ✅ Variables de entorno
- ✅ Logging de errores
