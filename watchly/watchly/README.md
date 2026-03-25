# 🎬 WATCHLY — Tu cine, centralizado

App para buscar películas y descubrir dónde verlas, construida con HTML/CSS/JS + Node.js/Express + Supabase.

---

## 📁 Estructura del proyecto

```
watchly/
├── backend/
│   ├── config/
│   │   ├── supabase.js       # Cliente Supabase
│   │   └── schema.sql        # SQL para crear tablas en Supabase
│   ├── controllers/
│   │   ├── authController.js      # Register / Login
│   │   ├── moviesController.js    # TMDb API
│   │   ├── favoritesController.js # CRUD favoritas
│   │   └── groupsController.js    # Modo grupo
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── movies.js
│   │   ├── favorites.js
│   │   └── groups.js
│   ├── server.js             # Entry point Express
│   ├── package.json
│   └── .env.example          # Variables de entorno
│
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── api.js            # Capa de servicios (fetch)
    │   ├── auth.js           # Manejo de autenticación
    │   └── app.js            # Lógica principal
    └── index.html
```

---

## 🚀 Setup paso a paso

### 1️⃣ Obtener API Key de TMDb (gratis)

1. Ir a [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Crear cuenta gratuita
3. Ir a **Configuración → API → Solicitar API Key**
4. Elegir "Developer" y completar el formulario
5. Copiar tu **API Key (v3 auth)**

---

### 2️⃣ Crear proyecto en Supabase (gratis)

1. Ir a [https://supabase.com](https://supabase.com) y crear cuenta
2. Crear un nuevo proyecto
3. Ir a **SQL Editor** y pegar el contenido de `backend/config/schema.sql`
4. Ejecutar el script → crea las tablas `users`, `favorites`, `groups`
5. Ir a **Settings → API** y copiar:
   - `Project URL`
   - `anon public key`

---

### 3️⃣ Configurar variables de entorno

```bash
cd backend
cp .env.example .env
```

Editá `.env` con tus credenciales:

```env
TMDB_API_KEY=tu_api_key_de_tmdb
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=tu_anon_key
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
PORT=3001
FRONTEND_URL=http://localhost:5500
```

---

### 4️⃣ Instalar dependencias e iniciar backend

```bash
cd backend
npm install
npm run dev      # con nodemon (recarga automática)
# o
npm start        # producción
```

El servidor corre en: `http://localhost:3001`

---

### 5️⃣ Abrir el frontend

Con **Live Server** (extensión de VS Code):
1. Abrí la carpeta `frontend/` en VS Code
2. Click derecho en `index.html` → "Open with Live Server"
3. Se abre en `http://localhost:5500`

O con cualquier servidor estático:
```bash
cd frontend
npx serve .
```

---

## 🔌 Endpoints de la API

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |

### Movies (TMDb)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/movies/popular` | Películas populares |
| GET | `/api/movies/search?q=inception` | Buscar películas |
| GET | `/api/movies/:id` | Detalle + providers + cast |
| GET | `/api/movies/discover?genre=28&year=2023&rating=7` | Filtros |
| GET | `/api/movies/random?genre=28` | Película aleatoria |
| GET | `/api/movies/genres` | Lista de géneros |

### Favorites (requiere JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/favorites` | Mis favoritas |
| POST | `/api/favorites` | Agregar favorita |
| DELETE | `/api/favorites/:movieId` | Eliminar favorita |
| GET | `/api/favorites/check/:movieId` | ¿Está guardada? |

### Groups (requiere JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/groups/create` | Crear sala |
| POST | `/api/groups/join` | Unirse con código |
| GET | `/api/groups/:code` | Ver estado del grupo |
| POST | `/api/groups/:code/vote` | Votar película |

---

## 📚 Temas del cronograma incluidos

| Clase | Tema | Dónde está en el proyecto |
|-------|------|---------------------------|
| 2 | HTTP y API REST | `server.js` + todos los controllers |
| 3 | Node.js + Express | Toda la carpeta `backend/` |
| 4 | Autenticación y Autorización | `authController.js` + `middleware/auth.js` (JWT + bcrypt) |
| 7 | Base de datos | `config/supabase.js` + `favoritesController.js` + `groupsController.js` |
| 8 | WebSocket / PubSub | Arquitectura preparada en `groupsController.js` (votos en tiempo real via polling) |
| 11 | Documentación | Este README + comentarios en código |

---

## 🔐 Seguridad implementada

- **JWT** para autenticación stateless
- **bcrypt** para hasheo de contraseñas
- **Rate limiting** (100 req / 15 min por IP)
- **CORS** configurado por origen
- **Row Level Security** en Supabase

---

## 💡 Funciones principales

- 🔎 **Búsqueda** de películas por nombre
- 🎬 **Detalle** con sinopsis, rating, duración, cast
- 📺 **Plataformas disponibles** (Netflix, Prime, Disney+, etc.)
- ❤️ **Favoritas** persistidas en Supabase (requiere login)
- 🎲 **"No sé qué ver"** — película aleatoria por género
- 🎭 **Filtros** por género, año y rating
- 👥 **Modo Grupo** — sala con código, votar películas

---

## 📦 Dependencias del backend

```
express          — servidor HTTP
cors             — Cross-Origin Resource Sharing
dotenv           — variables de entorno
axios            — llamadas a TMDb
@supabase/supabase-js — base de datos
bcryptjs         — hasheo de contraseñas
jsonwebtoken     — autenticación JWT
express-rate-limit — protección ante abusos
```

---

*Proyecto académico — Datos provistos por [TMDb](https://www.themoviedb.org/)*
