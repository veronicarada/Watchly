<template>
  <div class="section-content">
    <div class="section-header">
      <h2>MIS LISTAS</h2>
      <span class="section-badge">
        {{ activeTab === 'favorites' ? favorites.length : watched.length }} guardadas
      </span>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'favorites' }]" @click="activeTab = 'favorites'">
        ❤️ Guardados
      </button>
      <button :class="['tab-btn', { active: activeTab === 'watched' }]" @click="activeTab = 'watched'">
        ✅ Ya vistas
      </button>
    </div>

    <div v-if="!auth.isLoggedIn" class="auth-prompt">
      <p>Iniciá sesión para ver tus listas</p>
      <button class="btn-primary" @click="modal.openAuth('login')">Iniciar sesión</button>
    </div>

    <template v-else>
      <div v-if="activeTab === 'favorites'">
        <div v-if="loadingFav" class="loading-dots"><span/><span/><span/></div>
        <p v-else-if="!favorites.length" class="error-msg">Todavía no tenés favoritas guardadas 🎬</p>
        <div v-else class="movies-grid">
          <MovieCard v-for="f in favorites" :key="f.id" :movie="f" :removable="true" @remove="removeFav"/>
        </div>
      </div>

      <div v-if="activeTab === 'watched'">
        <div v-if="loadingWatched" class="loading-dots"><span/><span/><span/></div>
        <p v-else-if="!watched.length" class="error-msg">Todavía no marcaste ninguna como vista 👁️</p>
        <div v-else class="movies-grid">
          <MovieCard v-for="w in watched" :key="w.id" :movie="w" :removable="true" @remove="removeWatched"/>
        </div>
      </div>
    </template>
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
const favorites      = ref([])
const watched        = ref([])
const loadingFav     = ref(false)
const loadingWatched = ref(false)
const activeTab      = ref('favorites')

async function loadFavorites() {
  if (!auth.isLoggedIn) return
  loadingFav.value = true
  try { favorites.value = await api.getFavorites() }
  catch { toast.show('Error al cargar favoritas', 'error') }
  finally { loadingFav.value = false }
}
async function loadWatched() {
  if (!auth.isLoggedIn) return
  loadingWatched.value = true
  try { watched.value = await api.getWatched() }
  catch { toast.show('Error al cargar ya vistas', 'error') }
  finally { loadingWatched.value = false }
}

async function removeFav(movieId) {
  try {
    await api.removeFavorite(movieId)
    favorites.value = favorites.value.filter(f => f.movie_id !== movieId)
    toast.show('Eliminada de favoritas', 'info')
  } catch { toast.show('Error al eliminar', 'error') }
}
async function removeWatched(movieId) {
  try {
    await api.removeWatched(movieId)
    watched.value = watched.value.filter(w => w.movie_id !== movieId)
    toast.show('Eliminada de ya vistas', 'info')
  } catch { toast.show('Error al eliminar', 'error') }
}

onMounted(() => { loadFavorites(); loadWatched() })
watch(() => auth.isLoggedIn, () => { loadFavorites(); loadWatched() })
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
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid $border;
  background: $bg3;
  color: $text2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: $bg4;
    color: $text;
    border-color: $border;
  }

  &:hover:not(.active) {
    background: $bg4;
    color: $text;
  }
}
</style>
