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
                <a href="https://www.themoviedb.org" target="_blank" class="rating-badge tmdb-rating" title="Puntuación de TMDb">
                  <img
                    src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                    alt="TMDb"
                    class="tmdb-logo"
                  />
                  <span>★ {{ movie.vote_average?.toFixed(1) }}</span>
                </a>
                <span>{{ year }}</span>
                <span>{{ movie.runtime ? movie.runtime + ' min' : (movie.episode_run_time?.[0] ? movie.episode_run_time[0] + ' min/ep' : '—') }}</span>
              </div>
              <p class="modal-overview">{{ movie.overview || 'Sin sinopsis disponible.' }}</p>

              <div v-if="movie.cast && movie.cast.length" class="modal-section">
                <h4>ELENCO</h4>
                <div class="cast-row">
                  <div
                    v-for="actor in movie.cast"
                    :key="actor.id"
                    class="cast-item clickable"
                    @click="openActorDetail(actor)"
                  >
                    <img
                      :src="actor.profile_path
                        ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path
                        : 'https://via.placeholder.com/60x60/1a1a2e/FFD700?text=?'"
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
                    @click="handleProviderClick($event, prov.provider_id)"
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
                <button class="btn-watched" :class="{ active: isWatched }" @click="toggleWatched">
                  {{ isWatched ? '✅ Vista' : '👁 Marcar como vista' }}
                </button>
                <button v-if="isInCines" class="btn-secondary" @click="showCinesPopup = true">📍 Ver en cines</button>
                <div v-if="showCinesPopup" class="cines-popup">
                  <p>¿En qué ciudad querés ver la película?</p>
                  <input v-model="ciudadCines" type="text" placeholder="Ej: Pilar, Buenos Aires" class="cines-input"/>
                  <div class="cines-actions">
                    <button class="btn-primary" @click="buscarCines">Buscar</button>
                    <button class="btn-secondary" @click="showCinesPopup = false">Cancelar</button>
                  </div>
                </div>
              </div>

              <div class="modal-section reviews-section">
                <div class="reviews-header-row">
                  <h4>OPINIONES</h4>
                  <div v-if="averageRating" class="avg-rating-badge">
                    <span class="avg-stars">
                      <template v-for="n in 5" :key="n">
                        <span :class="n <= Math.round(Number(averageRating)) ? 'star-filled' : 'star-empty'">★</span>
                      </template>
                    </span>
                    <span class="avg-value">{{ averageRating }}</span>
                    <span class="avg-label">· {{ reviews.length }} {{ reviews.length === 1 ? 'opinión' : 'opiniones' }}</span>
                  </div>
                </div>

                <div v-if="auth.isLoggedIn && !yaPublicó" class="review-form">
                  <p class="review-hint">¿Viste esta película? Contanos qué te pareció y elegí cuántas estrellas le das.</p>
                  <div class="stars-input">
                    <button
                      v-for="n in 5" :key="n"
                      class="star-btn"
                      :class="{ active: n <= rating }"
                      @click="rating = (rating === n ? 0 : n)"
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
                  <p v-if="starWarning" class="star-warning">
                    ⭐ Elegí cuántas estrellas le das antes de publicar
                  </p>
                </div>

                <p v-else-if="!auth.isLoggedIn" class="no-providers">
                  <button class="link-btn" @click="modal.openAuth('login')">Iniciá sesión</button> para dejar tu opinión
                </p>

                <div v-if="reviews.length" class="reviews-list">
                  <div v-for="r in reviews" :key="r.id" class="review-item">
                    <template v-if="reviewEditandoId !== r.id">
                      <div class="review-header">
                        <span class="review-user">{{ r.user_username || r.user_email?.split('@')[0] }}</span>
                        <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                      </div>
                      <p class="review-comment">{{ r.comment }}</p>
                      <div class="review-footer-actions">
                        <template v-if="auth.isLoggedIn && auth.user?.id === r.user_id">
                          <div class="review-reactions-row">
                            <span class="rx-readonly" :class="{ active: r.agree_count > 0 }">
                              🤝 Concuerdo <span class="rx-badge">{{ r.agree_count || 0 }}</span>
                            </span>
                            <span class="rx-readonly" :class="{ active: r.disagree_count > 0 }">
                              👎 Desacuerdo <span class="rx-badge">{{ r.disagree_count || 0 }}</span>
                            </span>
                            <button class="btn-action-edit" @click="habilitarEdicion(r)">✏️ Editar</button>
                            <button class="btn-action-delete" @click="handleDeleteReview(r.id)">🗑️ Eliminar</button>
                          </div>
                        </template>
                        <template v-else-if="auth.isLoggedIn">
                          <div class="review-reactions-row">
                            <button class="rx-btn agree" :class="{ active: r.user_voted === 'agree' }" @click="handleReactReview(r, 'agree')">
                              🤝 Concuerdo <span class="rx-badge">{{ r.agree_count || 0 }}</span>
                            </button>
                            <button class="rx-btn disagree" :class="{ active: r.user_voted === 'disagree' }" @click="handleReactReview(r, 'disagree')">
                              👎 Desacuerdo <span class="rx-badge">{{ r.disagree_count || 0 }}</span>
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="review-reactions-row">
                            <span class="rx-readonly">🤝 <span class="rx-badge">{{ r.agree_count || 0 }}</span></span>
                            <span class="rx-readonly">👎 <span class="rx-badge">{{ r.disagree_count || 0 }}</span></span>
                          </div>
                        </template>
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
                        <textarea v-model="editComment" class="review-textarea" rows="2"></textarea>
                        <div class="edit-buttons-row">
                          <button class="btn-primary btn-save" @click="handleUpdateReview(r.id)">Guardar</button>
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

    <Transition name="actor-slide">
      <div v-if="selectedActor || actorLoading" class="actor-overlay" @click.self="selectedActor = null">
        <div class="actor-panel">
          <button class="actor-close" @click="selectedActor = null">✕</button>
          <div v-if="actorLoading" class="loading-dots" style="padding:60px">
            <span></span><span></span><span></span>
          </div>
          <template v-else-if="selectedActor">
            <div class="actor-header">
              <img
                :src="selectedActor.profile_path
                  ? 'https://image.tmdb.org/t/p/w185' + selectedActor.profile_path
                  : 'https://via.placeholder.com/100x150/1a1a2e/FFD700?text=?'"
                :alt="selectedActor.name"
                class="actor-profile-img"
              />
              <div class="actor-info">
                <h3 class="actor-name">{{ selectedActor.name }}</h3>
                <p v-if="selectedActor.birthday" class="actor-meta">🎂 {{ selectedActor.birthday }}</p>
                <p v-if="selectedActor.place_of_birth" class="actor-meta">📍 {{ selectedActor.place_of_birth }}</p>
              </div>
            </div>
            <div v-if="selectedActor.biography" class="actor-bio-section">
              <p class="actor-bio" :class="{ expanded: showBio }">{{ selectedActor.biography }}</p>
              <button class="bio-toggle" @click="showBio = !showBio">
                {{ showBio ? 'Ver menos ▲' : 'Ver más ▼' }}
              </button>
            </div>
            <div v-if="selectedActor.known_for?.length" class="actor-known">
              <h4>CONOCIDO/A POR</h4>
              <div class="known-row">
                <div v-for="item in selectedActor.known_for" :key="item.id" class="known-item">
                  <img :src="'https://image.tmdb.org/t/p/w92' + item.poster_path" :alt="item.title" class="known-poster"/>
                  <span class="known-title">{{ item.title }}</span>
                  <span class="known-year">{{ item.year }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- POPUP SNACKS -->
    <Transition name="snack-fade">
      <div v-if="showSnackPopup" class="snack-overlay">
        <div class="snack-popup">
        
          <p class="snack-emoji">🍿</p>
          <p class="snack-title">¡Elegí tu snack favorito!</p>
          <p class="snack-sub">Pochoclos, golosinas, algo salado, algo dulce, algo para tomar... ¡que no falte nada!</p>
          <div class="snack-btns">
            <a class="snack-btn pedidoya" @click.prevent="goToDelivery('https://www.pedidosya.com.ar/?utm_source=google&utm_medium=cpc&utm_campaign=740125327&sem_tracker=740125327&gad_source=1&gad_campaignid=740125327&gbraid=0AAAAAD2Hl2jYyug4oOp0pZ_d-oBU4mgns&gclid=CjwKCAjwxITRBhBYEiwA6mZm7d41vecmt82aP7ocI9bDJaZzms9K2ip0xmJetZIfrN3by69tv0dDgxoC4Z0QAvD_BwE')">
              <span class="snack-btn-icon"></span> PedidosYa
           </a>
           <a class="snack-btn rappi" @click.prevent="goToDelivery('https://www.rappi.com.ar/tiendas/tipo/express-group')">
             <span class="snack-btn-icon"></span> Rappi
           </a>
           <a class="snack-btn ubereats" @click.prevent="goToDelivery('https://www.ubereats.com/ar/search?q=snacks')">
             <span class="snack-btn-icon"></span> Uber Eats
           </a>
          </div>
          <button class="snack-skip" @click="skipSnacks">→ Ir a la plataforma</button>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore }  from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const modal = useModalStore()
modal.loadNowPlaying()
const auth  = useAuthStore()
const toast = useToastStore()

const movie        = ref(null)
const loading      = ref(false)
const isWatched    = ref(false)
const isFav        = ref(false)
const reviews      = ref([])
const comment      = ref('')
const rating       = ref(0)
const isSubmitting = ref(false)
const yaPublicó   = ref(false)
const starWarning  = ref(false)
const reviewEditandoId = ref(null) 
const editComment      = ref('')
const editRating       = ref(5)
const showCinesPopup = ref(false)
const ciudadCines = ref('')
const showSnackPopup = ref(false)
const pendingProviderUrl = ref('')
const selectedActor  = ref(null)
const actorLoading   = ref(false)
const showBio        = ref(false)
// Promedio de estrellas de todas las reseñas visibles
const averageRating = computed(() => {
  if (!reviews.value.length) return null
  const sum = reviews.value.reduce((acc, r) => acc + (r.rating || 0), 0)
  return (sum / reviews.value.length).toFixed(1)
})
async function openActorDetail(actor) {
  selectedActor.value = null
  actorLoading.value  = true
  showBio.value       = false
  try {
    selectedActor.value = await api.personDetail(actor.id)
  } catch {
    toast.show('No se pudo cargar el perfil', 'error')
  } finally {
    actorLoading.value = false
  }
}

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

const isInCines = computed(() => {
  if (!movie.value) return false
  if (movie.value.media_type === 'tv') return false
  return modal.nowPlayingIds.has(movie.value.id)
})

function providerUrl(id) {
  return PROVIDERS[id]?.url ||
    'https://www.google.com/search?q=' + encodeURIComponent(movie.value?.title || '') + '+streaming+argentina'
}

function handleProviderClick(event, id) {
  event.preventDefault()
  pendingProviderUrl.value = providerUrl(id)
  showSnackPopup.value = true
}

function goToDelivery(deliveryUrl) {
  showSnackPopup.value = false
  pendingProviderUrl.value = ''
  window.open(deliveryUrl, '_blank')
}

function skipSnacks() {
  window.open(pendingProviderUrl.value, '_blank')
  showSnackPopup.value = false
  pendingProviderUrl.value = ''
}

function shortName(id, fallback) {
  return PROVIDERS[id]?.name || fallback?.substring(0, 10) || '?'
}

async function fetchReviews(movieId) {
  try {
    const data = await api.getReviews(movieId)
    
    // Mapeamos las reseñas asegurando que todas tengan estructura reactiva limpia en Vue
    reviews.value = data.map(r => ({
     ...r,
     agree_count: r.agree_count || 0,
     disagree_count: r.disagree_count || 0,
     user_voted: r.user_voted || null
   }))
  // Ocultar el formulario si el usuario ya publicó una reseña
  yaPublicó.value = reviews.value.some(r => r.user_id === auth.user?.id)
  } catch (err) {
    console.error('Error al traer las opiniones:', err)
  }
}

async function handleSendReview() {
  if (rating.value === 0) {
    starWarning.value = true
    setTimeout(() => starWarning.value = false, 3000)
    return
  }
  starWarning.value = false
  if (!comment.value.trim()) return
  isSubmitting.value = true
  try {
    const newReview = await api.createReview({
      movie_id: movie.value.id,
      rating:   rating.value,
      comment:  comment.value
    })
   reviews.value.unshift(newReview)
   yaPublicó.value = true
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
    yaPublicó.value = reviews.value.some(r => r.user_id === auth.user?.id)
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
      const watched = await api.checkWatched(id)
      isWatched.value = watched.isWatched
    } catch { }
  }
  loading.value = false
})
async function handleReactReview(review, type) {
  if (!auth.isLoggedIn) {
    modal.openAuth('login')
    toast.show('Iniciá sesión para reaccionar', 'info')
    return
  }

  const index = reviews.value.findIndex(r => r.id === review.id)
  if (index === -1) return

  const r = reviews.value[index]
  const snapshot = { ...r }

  try {
    const res = await api.reactToReview(review.id, type)

    let nuevo = { ...r }

    if (res.action === 'added') {
      nuevo.user_voted = type
      if (type === 'agree') nuevo.agree_count = (r.agree_count || 0) + 1
      else nuevo.disagree_count = (r.disagree_count || 0) + 1

    } else if (res.action === 'removed') {
      nuevo.user_voted = null
      if (type === 'agree') nuevo.agree_count = Math.max(0, (r.agree_count || 0) - 1)
      else nuevo.disagree_count = Math.max(0, (r.disagree_count || 0) - 1)

    } else if (res.action === 'changed') {
      nuevo.user_voted = type
      if (type === 'agree') {
        nuevo.agree_count = (r.agree_count || 0) + 1
        nuevo.disagree_count = Math.max(0, (r.disagree_count || 0) - 1)
      } else {
        nuevo.disagree_count = (r.disagree_count || 0) + 1
        nuevo.agree_count = Math.max(0, (r.agree_count || 0) - 1)
      }
    }

    reviews.value[index] = nuevo

  } catch (err) {
    reviews.value[index] = snapshot
    toast.show(err.message || 'No se pudo registrar tu reacción', 'error')
  }
}
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
async function toggleWatched() {
  if (!auth.isLoggedIn) {
    modal.openAuth('login')
    toast.show('Iniciá sesión para marcar como vista', 'info')
    return
  }
  try {
    if (isWatched.value) {
      await api.removeWatched(movie.value.id)
      isWatched.value = false
      toast.show('Eliminada de vistas', 'info')
    } else {
      await api.addWatched({
        movie_id:     movie.value.id,
        title:        movie.value.title,
        poster_path:  movie.value.poster_path,
        release_year: parseInt(year.value) || null,
        vote_average: movie.value.vote_average
      })
      isWatched.value = true
      toast.show('Marcada como vista!', 'success')
    }
  } catch (err) {
    toast.show(err.message, 'error')
  }
}

function buscarCines() {
  if (!ciudadCines.value.trim()) return
  const url = `https://www.google.com/search?q=${encodeURIComponent(movie.value.title)}+cines+${encodeURIComponent(ciudadCines.value)}`
  window.open(url, '_blank')
  showCinesPopup.value = false
  ciudadCines.value = ''
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

.review-form-edit { display: flex; flex-direction: column; gap: 10px; }
.edit-buttons-row {
  display: flex; gap: 8px; justify-content: flex-end;
  .btn-save { padding: 5px 12px; font-size: 12px; max-width: 100px; }
  .btn-cancel { padding: 5px 12px; font-size: 12px; max-width: 100px; background: transparent; border: 1px solid $border; color: $text2; }
}

  .rx-counter {
    font-size: 11px;
    color: $text3;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .review-footer-actions {
  margin-top: 10px;
}

.review-reactions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.rx-btn {
  background: $bg2;
  border: 1px solid $border;
  color: $text2;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  font-family: $font-body;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all $transition;

  &:hover {
    border-color: $text3;
    color: $text;
  }

  &.active {
    background: rgba($gold, 0.15);
    border-color: $gold;
    color: $gold;
    font-weight: 600;

    .rx-badge {
      background: $gold;
      color: $bg;
    }
  }
}

.rx-readonly {
  font-size: 12px;
  color: $text3;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid $border;
  background: $bg2;

  &.active {
    color: $gold;
    border-color: rgba($gold, 0.3);
  }
}

.rx-badge {
  background: $bg4;
  color: $text2;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.btn-action-edit {
  background: none;
  border: none;
  color: $gold;
  font-size: 12px;
  cursor: pointer;
  font-family: $font-body;
  padding: 5px 8px;
  border-radius: 20px;
  border: 1px solid rgba($gold, 0.3);
  transition: opacity 0.2s;
  &:hover { opacity: 0.7; }
}

.btn-action-delete {
  background: none;
  border: 1px solid rgba($red, 0.3);
  color: $red;
  font-size: 12px;
  cursor: pointer;
  font-family: $font-body;
  padding: 5px 8px;
  border-radius: 20px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.7; }
}
.btn-watched {
  flex: 1; padding: 12px; border-radius: $radius;
  border: 1px solid $border; background: transparent;
  color: $text2; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: $transition;
  &.active { background: rgba(0,200,100,0.15); border-color: #00c864; color: #00c864; }
  &:hover:not(.active) { border-color: $gold; color: $gold; }
}
.tmdb-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  &:hover { opacity: 0.85; }
}

.tmdb-logo {
  height: 16px;
  width: auto;
  border-radius: 3px;
}

.cast-item.clickable {
  cursor: pointer;
  transition: transform $transition;
  &:hover { transform: translateY(-4px); }
  &:hover .cast-photo { border-color: $gold; }
}

.actor-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.actor-panel {
  background: $bg2; border: 1px solid $border; border-radius: 16px;
  width: 100%; max-width: 480px; max-height: 85vh;
  overflow-y: auto; padding: 28px; position: relative;
}

.actor-close {
  position: absolute; top: 14px; right: 14px;
  background: rgba(0,0,0,0.6); border: 1px solid $border; color: $text;
  width: 32px; height: 32px; border-radius: 50%; font-size: 14px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  &:hover { background: $red; border-color: $red; }
}

.actor-header {
  display: flex; gap: 20px; margin-bottom: 20px;
}

.actor-profile-img {
  width: 90px; height: 135px; border-radius: 10px;
  object-fit: cover; border: 2px solid $border; flex-shrink: 0;
}

.actor-info { display: flex; flex-direction: column; gap: 8px; justify-content: center; }

.actor-name {
  font-family: $font-display; font-size: 22px; letter-spacing: 0.5px; color: $text;
}

.actor-meta { font-size: 13px; color: $text2; }

.actor-bio-section { margin-bottom: 20px; }

.actor-bio {
  font-size: 13px; color: $text2; line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 4;
  -webkit-box-orient: vertical; overflow: hidden;
  line-clamp: 4;
 &.expanded { display: block; -webkit-line-clamp: unset; line-clamp: unset; }
}

.bio-toggle {
  background: none; border: none; color: $gold;
  font-size: 12px; cursor: pointer; font-family: $font-body;
  margin-top: 6px; padding: 0;
}

.actor-known h4 {
  font-size: 11px; letter-spacing: 2px; color: $text3;
  text-transform: uppercase; margin-bottom: 10px;
}

.known-row {
  display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-thumb { background: $bg4; border-radius: 4px; }
}

.known-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; flex-shrink: 0; width: 70px;
}

.known-poster {
  width: 70px; height: 105px; border-radius: 6px;
  object-fit: cover; border: 1px solid $border;
}

.known-title {
  font-size: 10px; color: $text; text-align: center;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;
}

.known-year { font-size: 10px; color: $text3; }

/* Transición */
.actor-slide-enter-active, .actor-slide-leave-active { transition: opacity 0.2s ease; }
.actor-slide-enter-from, .actor-slide-leave-to { opacity: 0; }
.review-hint {
  font-size: 12px;
  color: $text3;
  margin: 0 0 4px;
  line-height: 1.5;
}

.cines-popup {
  width: 100%; margin-top: 12px;
  background: $bg3; border: 1px solid $border;
  border-radius: $radius-sm; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;

  p { font-size: 13px; color: $text2; margin: 0; }
}

.cines-input {
  padding: 10px 14px; background: $bg2; border: 1px solid $border;
  border-radius: $radius-sm; color: $text; font-size: 14px;
  font-family: $font-body; outline: none; width: 100%;
  &:focus { border-color: $gold; }
}

.cines-actions {
  display: flex; gap: 8px;
  button { flex: 1; }
}

.star-warning {
  font-size: 12px;
  color: $gold;
  background: rgba(255, 215, 0, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 6px;
  padding: 6px 12px;
  margin-top: 4px;
  text-align: center;
}

.reviews-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;

  h4 {
    margin-bottom: 0;
  }
}

.avg-rating-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba($gold, 0.08);
  border: 1px solid rgba($gold, 0.25);
  border-radius: 20px;
  padding: 4px 12px;
}

.avg-stars {
  display: flex;
  gap: 1px;
  font-size: 13px;
  line-height: 1;
}

.star-filled {
  color: $gold;
}

.star-empty {
  color: $text3;
}

.avg-value {
  font-size: 14px;
  font-weight: 700;
  color: $gold;
  line-height: 1;
}

.avg-label {
  font-size: 11px;
  color: $text3;
}

.snack-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.snack-popup {
  background: $bg2; border: 1px solid rgba(255,215,0,0.3);
  border-radius: 20px; padding: 32px 28px; max-width: 380px; width: 100%;
  text-align: center; position: relative;
}
.snack-close {
  position: absolute; top: 14px; right: 14px;
  background: none; border: none; color: $text3;
  cursor: pointer; font-size: 16px;
  &:hover { color: $text; }
}
.snack-emoji { font-size: 48px; margin-bottom: 8px; }
.snack-title {
  font-family: $font-display; font-size: 22px; color: $gold;
  letter-spacing: 1px; margin-bottom: 8px;
}
.snack-sub {
  font-size: 13px; color: $text2; line-height: 1.6; margin-bottom: 20px;
}
.snack-btns {
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;
}
.snack-btn {
  padding: 12px 20px; border-radius: 12px;
  font-size: 14px; font-weight: 700;
  text-decoration: none; cursor: pointer;
  transition: opacity 0.2s; display: block;
  &:hover { opacity: 0.85; }
  &.pedidoya { background: #FA0050; color: white; }
  &.rappi { background: #FF441F; color: white; }
  &.ubereats { background: #1a7a45; color: white; }
}
.snack-skip {
  background: none; border: none; color: white;
  font-size: 14px; cursor: pointer; font-family: $font-body;
  text-decoration: underline;
  &:hover { color: $gold; }
}
.snack-fade-enter-active, .snack-fade-leave-active { transition: opacity 0.25s ease; }
.snack-fade-enter-from, .snack-fade-leave-to { opacity: 0; }
.snack-btn-icon {
  font-size: 18px;
  font-weight: 900;
  margin-right: 6px;
}
.snack-btn.pedidoya { font-family: 'Arial Rounded MT Bold', Arial, sans-serif; }
.snack-btn.rappi { font-family: 'Georgia', serif; font-style: italic; }
.snack-btn.ubereats { font-family: 'Arial', sans-serif; font-weight: 600; }
</style>