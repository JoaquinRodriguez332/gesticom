# Sistema de Gestión de Inventario

Un sistema completo de gestión de inventario con frontend en Next.js y backend en Node.js.

## 🚀 Características

- ✅ Crear, leer, actualizar y eliminar productos
- 🔍 Búsqueda en tiempo real
- 📊 Indicadores de stock (bajo, medio, alto)
- 🎨 Interfaz moderna con shadcn/ui
- 🗄️ Base de datos SQLite
- 🔄 API RESTful completa

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

### Backend

1. Navega a la carpeta del servidor:
\`\`\`bash
cd server
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Inicia el servidor:
\`\`\`bash
npm run dev
\`\`\`

El servidor estará disponible en `http://localhost:3001`

### Frontend

1. En la raíz del proyecto, instala las dependencias:
\`\`\`bash
npm install
\`\`\`

2. Inicia la aplicación:
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 📡 API Endpoints

- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos/:id` - Obtener un producto por ID
- `POST /api/productos` - Crear un nuevo producto
- `PUT /api/productos/:id` - Actualizar un producto
- `DELETE /api/productos/:id` - Eliminar un producto
- `GET /api/health` - Estado del servidor

## 🗄️ Base de Datos

El sistema usa SQLite con la siguiente estructura:

\`\`\`sql
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL,
  stock INTEGER NOT NULL,
  categoria TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  fecha_registro DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🔧 Configuración

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

## 📝 Uso

1. **Crear Producto**: Ve a la pestaña "Nuevo Producto" y llena el formulario
2. **Ver Inventario**: La pestaña "Inventario" muestra todos los productos
3. **Buscar**: Usa la barra de búsqueda para filtrar productos
4. **Editar**: Haz clic en el botón de editar en cualquier producto
5. **Eliminar**: Usa la pestaña "Eliminar" o el botón de eliminar en la lista

## 🎨 Tecnologías

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React

### Backend
- Node.js
- Express.js
- SQLite3
- CORS

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
