<template>
  <Teleport to="body">
    <div v-if="modal.movieId" class="modal-overlay" @click.self="modal.closeMovie()">
      <div class="modal-container">
        <button class="modal-close" @click="modal.closeMovie()">✕</button>

        <div v-if="loading" class="loading-dots" style="padding:80px">
          <span></span><span></span><span></span>
        </div>

        <template v-else-if="movie">
          <div
            v-if="movie.backdrop_path"
            class="modal-backdrop"
            :style="'background-image:url(https://image.tmdb.org/t/p/original' + movie.backdrop_path + ')'">
          </div>

          <div class="modal-body">
            <div class="modal-poster">
              <img :src="posterUrl" :alt="movie.title" @error="e => e.target.src = PLACEHOLDER"/>
            </div>
            <div class="modal-details">
              <div class="modal-genres">
                <span v-for="g in movie.genres" :key="g.id" class="genre-tag">{{ g.name }}</span>
              </div>
              <h2 class="modal-title">{{ movie.title }}</h2>
              <span v-if="movie.media_type === 'tv'" class="media-badge">📺 Serie</span>
              <p v-if="movie.tagline" class="modal-tagline">"{{ movie.tagline }}"</p>
              <div class="modal-meta">
                <span class="rating-badge">★ {{ movie.vote_average?.toFixed(1) }}</span>
                <span>{{ year }}</span>
                <span>{{ movie.runtime ? movie.runtime + ' min' : (movie.episode_run_time?.[0] ? movie.episode_run_time[0] + ' min/ep' : '—') }}</span>
              </div>
              <p class="modal-overview">{{ movie.overview || 'Sin sinopsis disponible.' }}</p>

              <div v-if="movie.cast && movie.cast.length" class="modal-section">
                <h4>ELENCO</h4>
                <div class="cast-row">
                  <div v-for="actor in movie.cast" :key="actor.id" class="cast-item">
                    <img
                      :src="actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/60x60/1a1a2e/FFD700?text=?'"
                      :alt="actor.name"
                      class="cast-photo"
                    />
                    <span class="cast-name">{{ actor.name }}</span>
                    <span class="cast-character">{{ actor.character }}</span>
                  </div>
                </div>
              </div>

              <div class="modal-section">
                <h4>DISPONIBLE EN</h4>
                <div class="providers-row">
                  <span v-if="!allProviders.length" class="no-providers">
                    No disponible en streaming actualmente
                  </span>
                  <a v-for="prov in allProviders"
                    :key="prov.provider_id + prov.type"
                    class="provider-item"
                    :href="providerUrl(prov.provider_id)"
                    target="_blank"
                    :title="prov.provider_name"
                  >
                    <img
                      :src="'https://image.tmdb.org/t/p/original' + prov.logo_path"
                      :alt="prov.provider_name"
                      class="provider-logo"
                    />
                    <span class="provider-name-label">{{ shortName(prov.provider_id, prov.provider_name) }}</span>
                    <span v-if="prov.type === 'rent'" class="provider-type">Alquilar</span>
                    <span v-if="prov.type === 'buy'" class="provider-type">Comprar</span>
                  </a>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-primary" :class="{ active: isFav }" @click="toggleFav">
                  {{ isFav ? 'GUARDADA' : 'GUARDAR' }}
                </button>
                <a :href="'https://www.google.com/search?q=' + encodeURIComponent(movie.title) + '+cines+Buenos+Aires'"
                  target="_blank"
                  class="btn-secondary"
                >Ver en cines</a>
              </div>

              <div class="modal-section reviews-section">
                <h4>OPINIONES</h4>
                <div v-if="auth.isLoggedIn" class="review-form">
                  <div class="stars-input">
                    <button
                      v-for="n in 5" :key="n"
                      class="star-btn"
                      :class="{ active: n <= rating }"
                      @click="rating = n"
                    >★</button>
                  </div>
                  <textarea
                    v-model="comment"
                    placeholder="Escribí tu opinión..."
                    class="review-textarea"
                    rows="2"
                  ></textarea>
                  <button class="btn-primary" :disabled="isSubmitting || !comment.trim()" @click="handleSendReview">
                    {{ isSubmitting ? 'Publicando...' : 'Publicar opinión' }}
                  </button>
                </div>
                <p v-else class="no-providers">
                  <button class="link-btn" @click="modal.openAuth('login')">Iniciá sesión</button> para dejar tu opinión
                </p>
              <div v-if="reviews.length" class="reviews-list">
  <div v-for="r in reviews" :key="r.id" class="review-item">
    
    <template v-if="reviewEditandoId !== r.id">
      <div class="review-header">
        <span class="review-user">{{ r.user_email?.split('@')[0] }}</span>
        <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
      </div>
      <p class="review-comment">{{ r.comment }}</p>

      <div v-if="auth.isLoggedIn && auth.user?.id === r.user_id" class="review-my-actions">
        <button class="btn-action-edit" @click="habilitarEdicion(r)">✏️ Editar</button>
        <button class="btn-action-delete" @click="handleDeleteReview(r.id)">🗑️ Eliminar</button>
      </div>
    </template>

    <template v-else>
      <div class="review-form-edit">
        <div class="stars-input">
          <button
            v-for="n in 5" :key="n"
            class="star-btn"
            :class="{ active: n <= editRating }"
            @click="editRating = n"
          >★</button>
        </div>
        <textarea
          v-model="editComment"
          class="review-textarea"
          rows="2"
        ></textarea>
        <div class="edit-buttons-row">
          <button class="btn-primary btn-save" @click="handleUpdateReview(r.id)">Guardar cambios</button>
          <button class="btn-secondary btn-cancel" @click="reviewEditandoId = null">Cancelar</button>
        </div>
      </div>
    </template>

  </div>
</div>
                <p v-else class="no-providers">Todavía no hay opiniones para esta película.</p>
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

const movie        = ref(null)
const loading      = ref(false)
const isFav        = ref(false)
const reviews      = ref([])
const comment      = ref('')
const rating       = ref(5)
const isSubmitting = ref(false)
const reviewEditandoId = ref(null) 
const editComment      = ref('')
const editRating       = ref(5)


const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=NO'

const PROVIDERS = {
  8:    { name: 'Netflix',     url: 'https://www.netflix.com' },
  9:    { name: 'Prime',       url: 'https://www.primevideo.com' },
  119:  { name: 'Prime',       url: 'https://www.primevideo.com' },
  337:  { name: 'Disney+',     url: 'https://www.disneyplus.com' },
  390:  { name: 'Disney+',     url: 'https://www.disneyplus.com' },
  350:  { name: 'Apple TV+',   url: 'https://tv.apple.com/ar' },
  2:    { name: 'Apple TV+',   url: 'https://tv.apple.com/ar' },
  1899: { name: 'Max',         url: 'https://www.max.com/ar/es' },
  283:  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com' },
  531:  { name: 'Paramount+',  url: 'https://www.paramountplus.com/ar' },
  582:  { name: 'Paramount+',  url: 'https://www.paramountplus.com/ar' },
  167:  { name: 'Claro Video', url: 'https://www.clarovideo.com' },
  457:  { name: 'VIX',         url: 'https://www.vix.com' },
  11:   { name: 'MUBI',        url: 'https://mubi.com/ar' },
  201:  { name: 'MUBI',        url: 'https://mubi.com/ar' },
  300:  { name: 'Pluto TV',    url: 'https://pluto.tv/es-419' },
  467:  { name: 'DIRECTV GO',  url: 'https://www.directvgo.com/ar' },
}

const posterUrl = computed(() =>
  movie.value?.poster_path
    ? 'https://image.tmdb.org/t/p/w500' + movie.value.poster_path
    : PLACEHOLDER
)

const year = computed(() =>
  movie.value?.release_date?.substring(0, 4) || '—'
)

const allProviders = computed(() => {
  if (!movie.value?.providers) return []
  const seen = new Set()
  const result = []
  const add = (list, type) => {
    if (!list) return
    for (const item of list) {
      const key = item.provider_id + '-' + type
      if (!seen.has(key) && item.logo_path && PROVIDERS[item.provider_id]) {
        seen.add(key)
        result.push({ ...item, type })
      }
    }
  }
  add(movie.value.providers.flatrate, 'flatrate')
  add(movie.value.providers.rent, 'rent')
  add(movie.value.providers.buy, 'buy')
  return result
})

function providerUrl(id) {
  return PROVIDERS[id]?.url ||
    'https://www.google.com/search?q=' + encodeURIComponent(movie.value?.title || '') + '+streaming+argentina'
}

function shortName(id, fallback) {
  return PROVIDERS[id]?.name || fallback?.substring(0, 10) || '?'
}

async function fetchReviews(movieId) {
  try {
    reviews.value = await api.getReviews(movieId)
  } catch (err) {
    console.error('Error al traer las opiniones:', err)
  }
}

async function handleSendReview() {
  if (!comment.value.trim()) return
  isSubmitting.value = true
  try {
    const newReview = await api.createReview({
      movie_id: movie.value.id,
      rating:   rating.value,
      comment:  comment.value
    })
    reviews.value.unshift(newReview)
    comment.value = ''
    rating.value  = 5
    toast.show('Opinión publicada!', 'success')
  } catch (err) {
    toast.show(err.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}
// 🚀 NUEVA FUNCIÓN: Activa el modo edición cargando los datos viejos de la reseña
function habilitarEdicion(review) {
  reviewEditandoId.value = review.id
  editComment.value = review.comment
  editRating.value = review.rating
}

// 🚀 NUEVA FUNCIÓN: Guarda los cambios en el backend y actualiza la lista localmente
async function handleUpdateReview(reviewId) {
  if (!editComment.value.trim()) return
  try {
    const updatedReview = await api.updateReview(reviewId, {
      rating: editRating.value,
      comment: editComment.value
    })
    
    // Actualizamos la reseña dentro de la lista reactiva en la pantalla
    const index = reviews.value.findIndex(r => r.id === reviewId)
    if (index !== -1) {
      reviews.value[index] = updatedReview
    }
    
    reviewEditandoId.value = null // Cierra el formulario de edición
    toast.show('Opinión editada con éxito!', 'success')
  } catch (err) {
    toast.show(err.message, 'error')
  }
}

// 🚀 NUEVA FUNCIÓN: Elimina la reseña del backend y de la pantalla al instante
async function handleDeleteReview(reviewId) {
  if (!confirm('¿Estás seguro de que querés eliminar tu opinión?')) return
  try {
    await api.deleteReview(reviewId)
    // Filtramos la lista local para remover la reseña borrada sin recargar la página
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
    toast.show('Opinión eliminada', 'info')
  } catch (err) {
    toast.show(err.message, 'error')
  }
}
watch(() => modal.movieId, async (idWithType) => {
  if (!idWithType) { movie.value = null; reviews.value = []; return }

  // Soporta formato "123" o "123_tv"
  const parts    = String(idWithType).split('_')
  const id       = parts[0]
  const type     = parts[1] || 'movie'

  loading.value = true
  isFav.value   = false
  reviews.value = []

  try {
    movie.value = await api.movieDetail(id, type)
    await fetchReviews(id)
  } catch (err) {
    toast.show('Error al cargar el detalle', 'error')
    loading.value = false
    return
  }

  if (auth.isLoggedIn) {
    try {
      const result = await api.checkFavorite(id)
      isFav.value = result.isFavorite
    } catch { }
  }
  loading.value = false
})

async function toggleFav() {
  if (!auth.isLoggedIn) {
    modal.openAuth('login')
    toast.show('Iniciá sesión para guardar favoritas', 'info')
    return
  }
  try {
    if (isFav.value) {
      await api.removeFavorite(movie.value.id)
      isFav.value = false
      toast.show('Eliminada de favoritas', 'info')
    } else {
      await api.addFavorite({
        movie_id:     movie.value.id,
        title:        movie.value.title,
        poster_path:  movie.value.poster_path,
        release_year: parseInt(year.value) || null,
        vote_average: movie.value.vote_average,
        overview:     movie.value.overview?.substring(0, 300) || ''
      })
      isFav.value = true
      toast.show('Guardada en favoritas!', 'success')
    }
  } catch (err) {
    toast.show(err.message, 'error')
  }
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
.media-badge {
  display: inline-block; padding: 2px 10px; background: rgba(255,215,0,0.1);
  border: 1px solid rgba(255,215,0,0.3); border-radius: 4px;
  font-size: 11px; color: $gold; margin-bottom: 8px;
}
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
.cast-row {
  display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-thumb { background: $bg4; border-radius: 4px; }
}
.cast-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; width: 60px; }
.cast-photo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 1px solid $border; }
.cast-name { font-size: 10px; font-weight: 600; color: $text; text-align: center; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.cast-character { font-size: 9px; color: $text3; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.providers-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
.provider-item { display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none; transition: opacity 0.2s; &:hover { opacity: 0.8; } }
.provider-logo { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid $border; }
.provider-name-label { font-size: 10px; color: $text2; text-align: center; max-width: 52px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.provider-type { font-size: 9px; color: $gold; font-weight: 600; text-transform: uppercase; }
.no-providers { font-size: 13px; color: $text3; }
.modal-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.modal-actions .btn-primary { flex: 1; }
.modal-actions .btn-secondary { flex: 1; text-align: center; }
.reviews-section { border-top: 1px solid $border; padding-top: 20px; }
.review-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.stars-input { display: flex; gap: 4px; }
.star-btn { font-size: 20px; background: none; border: none; color: $text3; cursor: pointer; transition: color $transition; &.active { color: $gold; } &:hover { color: $gold; } }
.review-textarea { padding: 10px 14px; background: $bg3; border: 1px solid $border; border-radius: $radius-sm; color: $text; font-family: $font-body; font-size: 13px; resize: none; outline: none; &:focus { border-color: $gold; } }
.link-btn { background: none; border: none; color: $gold; font-size: 13px; font-family: $font-body; cursor: pointer; }
.reviews-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
.review-item { background: $bg3; border: 1px solid $border; border-radius: $radius-sm; padding: 12px 14px; }
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.review-user { font-size: 12px; font-weight: 600; color: $text; }
.review-stars { font-size: 12px; color: $gold; letter-spacing: 1px; }
.review-comment { font-size: 13px; color: $text2; line-height: 1.5; }

@media (max-width: 600px) {
  .modal-body { flex-direction: column; }
  .modal-poster { width: 120px; margin-top: -60px; }
  .modal-title { font-size: 24px; }
}
.review-my-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: flex-end;
  
  button {
    background: none;
    border: none;
    font-size: 12px;
    cursor: pointer;
    font-family: $font-body;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
  .btn-action-edit { color: $gold; }
  .btn-action-delete { color: $red; }
}

.review-form-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-buttons-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  
  .btn-save { padding: 6px 12px; font-size: 12px; max-width: 140px; }
  .btn-cancel { padding: 6px 12px; font-size: 12px; max-width: 100px; background: transparent; border: 1px solid $border; color: $text2; }
}
</style>