<template>
  <div>
    <!-- Hero -->
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-badge">+ TU CINE, CENTRALIZADO</div>
        <h1>¿QUÉ VAS A<br><em>VER HOY?</em></h1>
        <p class="hero-sub">Buscá películas y descubrí dónde verlas.</p>
        <form class="search-bar" @submit.prevent="doSearch">
          <input v-model="query" type="text" placeholder="Buscar película..." autocomplete="off"/>
          <button type="submit" class="btn-search">Buscar</button>
        </form>
        <div class="genre-pills">
          <button :class="['genre-pill', { active: activeGenre === null }]" @click="filterGenre(null)">Todos</button>
          <button v-for="g in quickGenres" :key="g.id" :class="['genre-pill', { active: activeGenre === g.id }]" @click="filterGenre(g.id)">{{ g.name }}</button>
        </div>
      </div>
    </div>

    <!-- Promociones / En cartelera -->
<div class="section-content">
  <div class="section-header">
    <h2>EN CARTELERA</h2>
    <span class="section-badge">🎬 Cines ahora</span>
  </div>
  <div v-if="loadingNow" class="loading-dots"><span/><span/><span/></div>
  <div v-else class="movies-grid">
    <MovieCard v-for="m in nowPlaying" :key="m.id" :movie="m"/>
  </div>
</div>
    <!-- Popular movies -->
    <div class="section-content">
      <div class="section-header"><h2>POPULARES</h2></div>
      <div v-if="loading" class="loading-dots"><span/><span/><span/></div>
      <p v-else-if="error" class="error-msg">{{ error }}</p>
      <div v-else class="movies-grid">
        <MovieCard v-for="m in movies" :key="m.id" :movie="m"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { api } from '@/services/api'

const router = useRouter()
const query  = ref('')
const movies = ref([])
const loading = ref(false)
const error   = ref(null)
const activeGenre = ref(null)

const nowPlaying = ref([])
const loadingNow = ref(false)

async function loadNowPlaying() {
  loadingNow.value = true
  try {
    const data = await api.nowPlaying()
    nowPlaying.value = data.results.slice(0, 8)
  } finally {
    loadingNow.value = false
  }
}
const quickGenres = [
  { id: 28,  name: 'Acción' },
  { id: 35,  name: 'Comedia' },
  { id: 27,  name: 'Terror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18,  name: 'Drama' },
]

async function loadMovies(genre = null) {
  loading.value = true; error.value = null
  try {
    const data = genre
      ? await api.discover({ genre, sort: 'popularity.desc' })
      : await api.popular()
    movies.value = data.results.slice(0, 8)
  } catch { error.value = 'Error al cargar películas populares' }
  finally { loading.value = false }
}

function filterGenre(id) {
  activeGenre.value = id
  loadMovies(id)
}

function doSearch() {
  if (!query.value.trim()) return
  router.push({ path: '/explorar', query: { q: query.value } })
}

onMounted(() => {
  loadMovies()
  loadNowPlaying()
})
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.hero {
  background: $bg2; padding: 60px 24px 50px; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 80% at 50% -20%, rgba(255,215,0,0.06), transparent);
  }
}
.hero-inner { max-width: 900px; margin: 0 auto; position: relative; }
.hero-badge {
  display: inline-block; padding: 5px 14px; border: 1px solid $gold;
  border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 2px;
  color: $gold; text-transform: uppercase; margin-bottom: 20px;
}
h1 {
  font-family: $font-display; font-size: clamp(42px, 8vw, 80px);
  line-height: 0.95; letter-spacing: 2px; margin-bottom: 16px;
  em { color: $gold; font-style: normal; }
}
.hero-sub { color: $text2; font-size: 16px; margin-bottom: 32px; max-width: 500px; }
.search-bar {
  display: flex; max-width: 560px;
  background: $bg3; border: 1px solid $border; border-radius: $radius; overflow: hidden;
  transition: border-color $transition;
  &:focus-within { border-color: $gold; }
  input {
    flex: 1; padding: 14px 18px; background: transparent; border: none;
    color: $text; font-size: 15px; font-family: $font-body; outline: none;
    &::placeholder { color: $text3; }
  }
}
.btn-search {
  padding: 12px 24px; background: $gold; color: #000;
  font-size: 14px; font-weight: 700; border: none; transition: background $transition;
  &:hover { background: $gold2; }
}
.genre-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.genre-pill {
  padding: 6px 16px; border-radius: 20px; border: 1px solid $border;
  background: $bg3; color: $text2; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: $transition;
  &:hover, &.active { border-color: $gold; color: $gold; background: rgba(255,215,0,0.08); }
}
</style>
