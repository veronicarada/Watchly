<template>
  <Teleport to="body">
    <div v-if="modal.movieId" class="modal-overlay" @click.self="modal.closeMovie()">
      <div class="modal-container">
        <button class="modal-close" @click="modal.closeMovie()">✕</button>

        <div v-if="loading" class="loading-dots" style="padding:80px">
          <span/><span/><span/>
        </div>

        <template v-else-if="movie">
          <div v-if="movie.backdrop_path" class="modal-backdrop"
            :style="`background-image:url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`"/>

          <div class="modal-body">
            <div class="modal-poster">
              <img :src="posterUrl" :alt="movie.title" @error="e => e.target.src = PLACEHOLDER"/>
            </div>
            <div class="modal-details">
              <div class="modal-genres">
                <span v-for="g in movie.genres" :key="g.id" class="genre-tag">{{ g.name }}</span>
              </div>
              <h2 class="modal-title">{{ movie.title }}</h2>
              <p v-if="movie.tagline" class="modal-tagline">"{{ movie.tagline }}"</p>
              <div class="modal-meta">
                <span class="rating-badge">★ {{ movie.vote_average?.toFixed(1) }}</span>
                <span>{{ year }}</span>
                <span>{{ movie.runtime ? movie.runtime + ' min' : '—' }}</span>
              </div>
              <p class="modal-overview">{{ movie.overview || 'Sin sinopsis disponible.' }}</p>

              <div class="modal-section">
                <h4>DISPONIBLE EN</h4>
                <div class="providers-row">
                  <template v-if="movie.providers?.flatrate?.length">
                    <a v-for="p in movie.providers.flatrate" :key="p.provider_id"
                      class="provider-badge"
                      :style="`background:${providerColor(p.provider_id)}`"
                      :href="providerUrl(p.provider_id)"
                      target="_blank">
                      {{ providerName(p.provider_id, p.provider_name) }}
                    </a>
                  </template>
                  <span v-else class="no-providers">No disponible en streaming actualmente</span>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-primary" :class="{ active: isFav }" @click="toggleFav">
                  {{ isFav ? 'GUARDADA' : 'GUARDAR' }}
                </button>
                
                 <a :href="` https://www.google.com/search?q=${encodeURIComponent(movie.title)}+cines+Buenos+Aires`"
                    target="_blank" class="btn-secondary"></a>
                    Ver en cines
                < /a>
               
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore }  from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const modal = useModalStore()
const auth  = useAuthStore()
const toast = useToastStore()

const movie   = ref(null)
const loading = ref(false)
const isFav   = ref(false)

const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=NO'
const PROVIDERS = {
  8:   { name: 'Netflix',   color: '#E50914' },
  119: { name: 'Prime',     color: '#00A8E1' },
  337: { name: 'Disney+',   color: '#113CCF' },
  350: { name: 'Apple TV+', color: '#555555' },
  384: { name: 'HBO Max',   color: '#B535F5' },
  283: { name: 'Crunchyroll', color: '#F47521' },
}

const posterUrl = computed(() =>
  movie.value?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.value.poster_path}`
    : PLACEHOLDER
)
const year = computed(() => movie.value?.release_date?.substring(0, 4) || '—')

function providerColor(id) { return PROVIDERS[id]?.color || '#333' }
function providerName(id, fallback) {
  return PROVIDERS[id]?.name || fallback?.substring(0, 6) || '?'
}
function providerUrl(id) {
  const urls = {
    8:   'https://www.netflix.com',
    119: 'https://www.primevideo.com',
    337: 'https://www.disneyplus.com',
    350: 'https://tv.apple.com',
    384: 'https://www.max.com',
    283: 'https://www.crunchyroll.com',
  }
  return urls[id] || 'https://www.google.com/search?q=' + id
}

watch(() => modal.movieId, async (id) => {
  if (!id) { movie.value = null; return }
  loading.value = true
  try {
    movie.value = await api.movieDetail(id)
    if (auth.isLoggedIn) {
      const { isFavorite } = await api.checkFavorite(id)
      isFav.value = isFavorite
    }
  } catch { toast.show('Error al cargar la pelicula', 'error') }
  finally { loading.value = false }
})

async function toggleFav() {
  if (!auth.isLoggedIn) {
    modal.openAuth('login')
    toast.show('Inicia sesion para guardar favoritas', 'info')
    return
  }
  try {
    if (isFav.value) {
      await api.removeFavorite(movie.value.id)
      isFav.value = false
      toast.show('Eliminada de favoritas', 'info')
    } else {
      await api.addFavorite({
        movie_id: movie.value.id,
        title: movie.value.title,
        poster_path: movie.value.poster_path,
        release_year: parseInt(year.value) || null,
        vote_average: movie.value.vote_average,
        overview: movie.value.overview?.substring(0, 300)
      })
      isFav.value = true
      toast.show('Guardada en favoritas!', 'success')
    }
  } catch (err) { toast.show(err.message, 'error') }
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-container {
  background: $bg2; border: 1px solid $border; border-radius: 16px;
  max-width: 780px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;
}
.modal-close {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  background: rgba(0,0,0,0.7); border: 1px solid $border; color: $text;
  width: 36px; height: 36px; border-radius: 50%; font-size: 16px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all $transition;
  &:hover { background: $red; border-color: $red; }
}
.modal-backdrop {
  height: 200px; background-size: cover; background-position: center top; position: relative;
  &::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(to bottom, transparent 30%, $bg2);
  }
}
.modal-body { display: flex; gap: 28px; padding: 24px 28px 28px; }
.modal-poster {
  flex-shrink: 0; width: 160px; margin-top: -80px; position: relative; z-index: 1;
  img { width: 100%; border-radius: $radius; box-shadow: 0 8px 32px rgba(0,0,0,0.7); border: 2px solid $border; }
}
.modal-details { flex: 1; min-width: 0; }
.modal-genres { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.genre-tag { padding: 3px 10px; border: 1px solid $border; border-radius: 4px; font-size: 11px; color: $text2; }
.modal-title { font-family: $font-display; font-size: 32px; letter-spacing: 1px; margin-bottom: 4px; }
.modal-tagline { color: $text3; font-style: italic; font-size: 14px; margin-bottom: 12px; }
.modal-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
.rating-badge {
  background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.3);
  color: $gold; padding: 3px 10px; border-radius: 6px; font-size: 14px; font-weight: 700;
}
.modal-meta span { font-size: 13px; color: $text2; }
.modal-overview { font-size: 14px; line-height: 1.7; color: $text2; margin-bottom: 20px; }
.modal-section {
  margin-bottom: 20px;
  h4 { font-size: 11px; letter-spacing: 2px; color: $text3; text-transform: uppercase; margin-bottom: 10px; }
}
.providers-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.provider-badge {
  padding: 5px 14px; border-radius: 6px; font-size: 13px; font-weight: 700;
  color: #fff; letter-spacing: 1px; text-decoration: none;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
}
.no-providers { font-size: 13px; color: $text3; }
.modal-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.modal-actions .btn-primary { flex: 1; }
.modal-actions .btn-secondary { flex: 1; text-align: center; }

@media (max-width: 600px) {
  .modal-body { flex-direction: column; }
  .modal-poster { width: 120px; margin-top: -60px; }
  .modal-title { font-size: 24px; }
}
</style>