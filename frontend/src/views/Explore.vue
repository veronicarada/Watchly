<template>
  <div class="section-content">
    <div class="section-header"><h2>EXPLORAR</h2></div>

    <div class="filters-row">
      <div class="filter-group">
        <label>GÉNERO</label>
        <select v-model="filters.genre" class="filter-select">
          <option value="">Todos los géneros</option>
          <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>AÑO</label>
        <select v-model="filters.year" class="filter-select">
          <option value="">Todos los años</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>RATING</label>
        <select v-model="filters.rating" class="filter-select">
          <option value="">Cualquier rating</option>
          <option value="9">★ +9.0</option>
          <option value="8">★ +8.0</option>
          <option value="7">★ +7.0</option>
          <option value="6">★ +6.0</option>
        </select>
      </div>
      <button class="btn-primary" @click="applyFilters">FILTRAR</button>
    </div>

    <!-- FILTRO DE PLATAFORMAS -->
    <div class="platforms-section">
      <label class="platforms-label">PLATAFORMAS</label>
      <div class="platforms-row">
        <button
          v-for="p in platforms"
          :key="p.id"
          class="platform-chip"
          :class="{ active: selectedProviders.includes(p.id) }"
          @click="toggleProvider(p.id)"
          :title="p.name"
        >
          <img
            :src="`https://image.tmdb.org/t/p/original${p.logo}`"
            :alt="p.name"
            class="platform-logo"
          />
          <span class="platform-name">{{ p.name }}</span>
        </button>
      </div>
      <button
        v-if="selectedProviders.length"
        class="clear-providers"
        @click="selectedProviders = []"
      >
        ✕ Limpiar selección ({{ selectedProviders.length }})
      </button>
    </div>

    <p v-if="resultCount" class="result-count">{{ resultCount }}</p>

    <div v-if="loading" class="loading-dots">
      <span></span><span></span><span></span>
    </div>
    <p v-else-if="error" class="error-msg">{{ error }}</p>
    <p v-else-if="!movies.length && searched" class="error-msg">No se encontraron resultados 😕</p>
    <div v-else class="movies-grid">
      <MovieCard v-for="m in movies" :key="m.id + '_' + (m.media_type || 'movie')" :movie="m"/>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { api } from '@/services/api'

const route            = useRoute()
const movies           = ref([])
const genres           = ref([])
const loading          = ref(false)
const error            = ref(null)
const searched         = ref(false)
const resultCount      = ref('')
const filters          = ref({ genre: '', year: '', rating: '' })
const selectedProviders = ref([])

const platforms = [
  { id: 8,    name: 'Netflix',     logo: '/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: 9,    name: 'Prime',       logo: '/t/p/original/dQeAar5H991VYporEjUspolDarG.jpg' },
  { id: 337,  name: 'Disney+',     logo: '/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19d.jpg' },
  { id: 1899, name: 'Max',         logo: '/t/p/original/Ajqyt5oPwPVVBATFe1PN0oemfMH.jpg' },
  { id: 350,  name: 'Apple TV+',   logo: '/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { id: 531,  name: 'Paramount+',  logo: '/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' },
  { id: 283,  name: 'Crunchyroll', logo: '/t/p/original/8Gt1iClBlzTeQs8WQm8UrCoIXnQ.jpg' },
  { id: 11,   name: 'MUBI',        logo: '/t/p/original/bVR4Z1LCHY7gidXAJF5pMa4QaDS.jpg' },
  { id: 300,  name: 'Pluto TV',    logo: '/t/p/original/rinJD77VwQHmHPlM9kqnGBGCbKB.jpg' },
]

function toggleProvider(id) {
  const idx = selectedProviders.value.indexOf(id)
  if (idx === -1) selectedProviders.value.push(id)
  else selectedProviders.value.splice(idx, 1)
}

const currentYear = new Date().getFullYear()
const years = computed(() => {
  const result = []
  for (let y = currentYear; y >= 2000; y--) result.push(y)
  return result
})

async function applyFilters() {
  loading.value = true
  error.value = null
  searched.value = true
  try {
    const params = {}
    if (filters.value.genre)           params.genre     = filters.value.genre
    if (filters.value.year)            params.year      = filters.value.year
    if (filters.value.rating)          params.rating    = filters.value.rating
    if (selectedProviders.value.length) params.providers = selectedProviders.value.join('|')
    const data = await api.discover(params)
    movies.value = data.results
    resultCount.value = (data.total_results?.toLocaleString() || data.results.length) + ' resultados'
  } catch {
    error.value = 'Error al filtrar películas'
  } finally {
    loading.value = false
  }
}

async function searchByQuery(q) {
  loading.value = true
  error.value = null
  searched.value = true
  try {
    const data = await api.search(q)
    movies.value = data.results.sort((a, b) => b.popularity - a.popularity)
    resultCount.value = data.results.length + ' resultados para "' + q + '"'
  } catch {
    error.value = 'Error al buscar'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const genreData = await api.genres()
    genres.value = genreData?.genres || []
  } catch {
    genres.value = []
  }
  if (route.query.q) searchByQuery(route.query.q)
  else applyFilters()
})

watch(() => route.query.q, q => { if (q) searchByQuery(q) })
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.filters-row {
  display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; align-items: flex-end;
}
.filter-group {
  display: flex; flex-direction: column; gap: 4px;
  label { font-size: 11px; letter-spacing: 1px; color: $text3; text-transform: uppercase; }
}
.filter-select {
  padding: 10px 16px; background: $bg3; border: 1px solid $border;
  border-radius: $radius-sm; color: $text; font-size: 14px;
  font-family: $font-body; outline: none; cursor: pointer; min-width: 150px;
  &:focus { border-color: $gold; }
}

/* Plataformas */
.platforms-section {
  margin-bottom: 24px;
}
.platforms-label {
  display: block; font-size: 11px; letter-spacing: 1px;
  color: $text3; text-transform: uppercase; margin-bottom: 10px;
}
.platforms-row {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.platform-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 8px;
  background: $bg3; border: 1px solid $border; border-radius: 30px;
  cursor: pointer; transition: all $transition;
  &:hover { border-color: $text3; }
  &.active {
    border-color: $gold;
    background: rgba($gold, 0.1);
    .platform-name { color: $gold; }
  }
}
.platform-logo {
  width: 24px; height: 24px; border-radius: 6px; object-fit: cover;
}
.platform-name {
  font-size: 12px; color: $text2; font-weight: 600; white-space: nowrap;
}
.clear-providers {
  margin-top: 10px; background: none; border: none;
  color: $text3; font-size: 12px; cursor: pointer;
  font-family: $font-body;
  &:hover { color: $red; }
}

.result-count { font-size: 13px; color: $text3; margin-bottom: 20px; }
</style>