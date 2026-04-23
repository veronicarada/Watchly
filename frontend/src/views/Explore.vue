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
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
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

    <p v-if="resultCount" class="result-count">{{ resultCount }} resultados</p>

    <div v-if="loading" class="loading-dots"><span/><span/><span/></div>
    <p v-else-if="error" class="error-msg">{{ error }}</p>
    <p v-else-if="!movies.length && searched" class="error-msg">No se encontraron resultados 😕</p>
    <div v-else class="movies-grid">
      <MovieCard v-for="m in movies" :key="m.id" :movie="m"/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { api } from '@/services/api'

const route   = useRoute()
const movies  = ref([])
const genres  = ref([])
const loading = ref(false)
const error   = ref(null)
const searched = ref(false)
const resultCount = ref('')
const filters = ref({ genre: '', year: '', rating: '' })

async function applyFilters() {
  loading.value = true; error.value = null; searched.value = true
  try {
    const params = {}
    if (filters.value.genre)  params.genre  = filters.value.genre
    if (filters.value.year)   params.year   = filters.value.year
    if (filters.value.rating) params.rating = filters.value.rating
    const data = await api.discover(params)
    movies.value = data.results
    resultCount.value = `${data.total_results?.toLocaleString() || data.results.length} resultados`
  } catch { error.value = 'Error al filtrar películas' }
  finally { loading.value = false }
}

async function searchByQuery(q) {
  loading.value = true; error.value = null; searched.value = true
  try {
    const data = await api.search(q)
    movies.value = data.results
    resultCount.value = `${data.results.length} resultados para "${q}"`
  } catch { error.value = 'Error al buscar' }
  finally { loading.value = false }
}

onMounted(async () => {
  const { data } = await api.genres()
  genres.value = data?.genres || []
  if (route.query.q) searchByQuery(route.query.q)
  else applyFilters()
})

watch(() => route.query.q, q => { if (q) searchByQuery(q) })
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;
.filters-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; align-items: flex-end; }
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
.result-count { font-size: 13px; color: $text3; margin-bottom: 20px; }
</style>
