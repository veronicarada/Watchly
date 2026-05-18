<template>
  <div>
    <!-- Hero -->
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-badge">+ TU CINE, CENTRALIZADO</div>
        <h1>¿QUÉ VAS A<br><em>VER HOY?</em></h1>
        <p class="hero-sub">Buscá películas y descubrí dónde verlas.</p>
        <form class="search-bar" @submit.prevent="doSearch">
  <div class="search-wrapper">
    <input
      v-model="query"
      type="text"
      placeholder="Buscar película..."
      autocomplete="off"
      @input="onInput"
      @blur="hideSuggestions"
    />
    <ul v-if="suggestions.length" class="suggestions">
      <li v-for="s in suggestions" :key="s.id" @mousedown.prevent="selectSuggestion(s)">
        <img v-if="s.poster_path" :src="`https://image.tmdb.org/t/p/w45${s.poster_path}`"/>
        <span class="no-poster" v-else>🎬</span>
        <div>
          <span class="sug-title">{{ s.title }}</span>
          <span class="sug-year">{{ s.release_date?.slice(0,4) }}</span>
        </div>
      </li>
    </ul>
  </div>
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
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useModalStore } from '@/stores/modal'
import MovieCard from '@/components/MovieCard.vue'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const modal = useModalStore()
const query  = ref('')
const suggestions = ref([])
let searchTimeout = null
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

function onInput() {
  clearTimeout(searchTimeout)
  if (query.value.length < 2) { suggestions.value = []; return }
  searchTimeout = setTimeout(async () => {
    try {
      const data = await api.search(query.value)
      suggestions.value = data.results.slice(0, 10)
    } catch { suggestions.value = [] }
  }, 300)
}

function hideSuggestions() {
  setTimeout(() => { suggestions.value = [] }, 150)
}

function selectSuggestion(movie) {
  suggestions.value = []
  query.value = ''
  modal.openMovie(movie.id)
}

onMounted(() => {
  loadMovies()
  loadNowPlaying()
  if (route.query.login === 'true') {
    modal.openAuth('login')
  }
})

watch(() => route.query.login, (val) => {
  if (val === 'true') modal.openAuth('login')
})

</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.hero {
  background: $bg2; padding: 60px 24px 50px; position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; inset: 0;
    background-image: url('@/assets/ModoOscuro.png');
    background-size: cover;
    background-position: center;
    opacity: 0.4;
  }
}
.hero-inner { max-width: 900px; margin: 0 auto; position: relative; z-index: 1; }
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
  background: $bg3; border: 1px solid $border; border-radius: $radius; overflow: visible;
  transition: border-color $transition;
  &:focus-within { border-color: $gold; }
}
.btn-search {
  padding: 12px 24px; background: $gold; color: #000;
  font-size: 14px; font-weight: 700; border: none; transition: background $transition;
  &:hover { background: $gold2; }
}

.search-wrapper {
  flex: 1; position: relative;
  input {
    width: 100%; padding: 14px 18px; background: transparent; border: none;
    color: $text; font-size: 15px; font-family: $font-body; outline: none;
    &::placeholder { color: $text3; }
  }
}

.suggestions {
  position: absolute; top: 100%; left: 0; right: 0;
  background: $bg2; border: 1px solid $border; border-radius: $radius-sm;
  overflow: hidden; z-index: 200; list-style: none;
  margin: 4px 0 0; padding: 0; box-shadow: $shadow;

  li {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; cursor: pointer; transition: $transition;
    &:hover { background: $bg3; }

    img { width: 32px; height: 48px; object-fit: cover; border-radius: 4px; }
    .no-poster { width: 32px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  }
}

.sug-title { font-size: 13px; font-weight: 600; display: block; }
.sug-year { font-size: 11px; color: $text3; }

.genre-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.genre-pill {
  padding: 6px 16px; border-radius: 20px; border: 1px solid $border;
  background: $bg3; color: $text2; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: $transition;
  &:hover, &.active { border-color: $gold; color: $gold; background: rgba(255,215,0,0.08); }
}
</style>

<style lang="scss">
@use '@/assets/variables' as *;
[data-theme="light"] .hero::before {
  background-image: url('@/assets/Modoclaro.png');
  opacity: 0.6;
}
</style>