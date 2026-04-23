<!-- Random.vue -->
<template>
  <div>
    <div class="random-hero">
      <div class="emoji">🎲</div>
      <h2>NO SÉ QUÉ VER</h2>
      <p>Dejá que Watchly elija por vos.</p>
      <div class="random-controls">
        <select v-model="genre" class="filter-select">
          <option value="">Cualquier género</option>
          <option value="28">Acción</option>
          <option value="35">Comedia</option>
          <option value="27">Terror</option>
          <option value="878">Sci-Fi</option>
          <option value="18">Drama</option>
          <option value="10749">Romance</option>
          <option value="16">Animación</option>
          <option value="80">Crimen</option>
        </select>
        <button class="btn-random" :disabled="loading" @click="getRandom">
          {{ loading ? '🎲 Buscando...' : '🎲 SORPRENDEME' }}
        </button>
      </div>
    </div>
    <div class="section-content">
      <div class="section-header"><h2>POPULARES AHORA</h2></div>
      <div v-if="loadingPop" class="loading-dots"><span/><span/><span/></div>
      <div v-else class="movies-grid">
        <MovieCard v-for="m in popular" :key="m.id" :movie="m"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MovieCard from '@/components/MovieCard.vue'
import { useModalStore } from '@/stores/modal'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const modal   = useModalStore()
const toast   = useToastStore()
const genre   = ref('')
const loading = ref(false)
const popular = ref([])
const loadingPop = ref(false)

async function getRandom() {
  loading.value = true
  try {
    const movie = await api.random(genre.value)
    modal.openMovie(movie.id)
  } catch { toast.show('No se encontró película, intentá de nuevo', 'error') }
  finally { loading.value = false }
}

onMounted(async () => {
  loadingPop.value = true
  try { popular.value = (await api.popular()).results.slice(0, 8) }
  finally { loadingPop.value = false }
})
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;
.random-hero {
  text-align: center; padding: 60px 24px; background: $bg2; border-bottom: 1px solid $border;
  .emoji { font-size: 64px; margin-bottom: 20px; }
  h2 { font-family: $font-display; font-size: 48px; letter-spacing: 2px; margin-bottom: 12px; }
  p { color: $text2; margin-bottom: 32px; }
}
.random-controls { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.filter-select {
  padding: 10px 16px; background: $bg3; border: 1px solid $border;
  border-radius: $radius-sm; color: $text; font-size: 14px; font-family: $font-body; outline: none; min-width: 180px;
}
.btn-random {
  padding: 16px 40px; background: $gold; color: #000; border: none; border-radius: $radius;
  font-size: 18px; font-weight: 700; font-family: $font-display; letter-spacing: 1px;
  transition: all 0.2s; box-shadow: 0 4px 20px rgba(255,215,0,0.3); cursor: pointer;
  &:hover { transform: scale(1.04); box-shadow: 0 8px 30px rgba(255,215,0,0.5); }
  &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
}
</style>
