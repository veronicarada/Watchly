<template>
  <div class="section-content">
    <div class="section-header">
      <h2>MIS FAVORITAS</h2>
      <span class="section-badge">{{ favorites.length }} guardadas</span>
    </div>

    <div v-if="!auth.isLoggedIn" class="auth-prompt">
      <p>Iniciá sesión para ver tus favoritas</p>
      <button class="btn-primary" @click="modal.openAuth('login')">Iniciar sesión</button>
    </div>

    <div v-else-if="loading" class="loading-dots"><span/><span/><span/></div>
    <p v-else-if="!favorites.length" class="error-msg">Todavía no tenés favoritas guardadas 🎬</p>

    <div v-else class="movies-grid">
      <MovieCard
        v-for="f in favorites" :key="f.id"
        :movie="f" :removable="true"
        @remove="removeFav"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import MovieCard from '@/components/MovieCard.vue'
import { useAuthStore }  from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const auth      = useAuthStore()
const modal     = useModalStore()
const toast     = useToastStore()
const favorites = ref([])
const loading   = ref(false)

async function loadFavorites() {
  if (!auth.isLoggedIn) return
  loading.value = true
  try { favorites.value = await api.getFavorites() }
  catch { toast.show('Error al cargar favoritas', 'error') }
  finally { loading.value = false }
}

async function removeFav(movieId) {
  try {
    await api.removeFavorite(movieId)
    favorites.value = favorites.value.filter(f => f.movie_id !== movieId)
    toast.show('Eliminada de favoritas', 'info')
  } catch { toast.show('Error al eliminar', 'error') }
}

onMounted(loadFavorites)
watch(() => auth.isLoggedIn, loadFavorites)
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;
.section-badge {
  background: $bg3; padding: 4px 12px; border-radius: 20px;
  font-size: 12px; color: $text2; border: 1px solid $border;
}
.auth-prompt {
  text-align: center; padding: 60px 24px; color: $text2;
  p { margin-bottom: 20px; font-size: 16px; }
}
</style>
