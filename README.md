# 🎬 WATCHLY — Vue.js + Node.js + Supabase

## 📁 Estructura del proyecto

```
watchly/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   │   ├── authController.js     ← register, login, Google OAuth
│   │   │   ├── moviesController.js   ← TMDb API
│   │   │   ├── favoritesController.js← CRUD Supabase
│   │   │   └── groupsController.js   ← Modo grupo
│   │   ├── middleware/
│   │   │   └── auth.js               ← JWT
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── movies.js
│   │       ├── favorites.js
│   │       └── groups.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   │   ├── variables.scss   ← variables SCSS globales
    │   │   └── main.scss        ← estilos globales
    │   ├── components/
    │   │   ├── Navbar.vue
    │   │   ├── MobileNav.vue
    │   │   ├── MovieCard.vue
    │   │   ├── MovieModal.vue
    │   │   ├── AuthModal.vue    ← login + registro + Google
    │   │   └── ToastContainer.vue
    │   ├── views/               ← páginas/tabs
    │   │   ├── Home.vue
    │   │   ├── Explore.vue
    │   │   ├── Random.vue
    │   │   ├── Favorites.vue
    │   │   └── Group.vue
    │   ├── router/
    │   │   └── index.js         ← Vue Router
    │   ├── stores/              ← Pinia state management
    │   │   ├── auth.js
    │   │   ├── modal.js
    │   │   └── toast.js
    │   ├── services/
    │   │   └── api.js           ← fetch al backend
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## 🚀 Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Completar TMDB_API_KEY, SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Completar VITE_GOOGLE_CLIENT_ID (opcional para Google OAuth)
npm install
npm run dev
```

La app abre en `http://localhost:5173`

---

## 🔑 Google OAuth 

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto → APIs & Services → Credentials
3. Create Credentials → OAuth Client ID → Web Application
4. Authorized origins: `http://localhost:5173`
5. Copiar Client ID → pegarlo en:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...`

---

## 📚 Temas del cronograma cubiertos

| Clase | Tema | Implementación |
|-------|------|----------------|
| 2 | HTTP + REST API | Routes + Controllers |
| 3 | Node.js + Express | `backend/src/` estructura modular |
| 4 | Auth + Autorización | JWT + bcrypt + Google OAuth |
| 7 | Base de datos | Supabase (users, favorites, groups) |
| 8 | WebSockets/PubSub | Arquitectura de votación en grupos |
| 11 | Documentación | Este README |
