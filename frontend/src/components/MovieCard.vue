<template>
  <div class="movie-card" @click="modal.openMovie(movie.id)">
    <div class="movie-poster">
      <img
        :src="posterUrl"
        :alt="movie.title"
        loading="lazy"
        @error="onImgError"
      />
      <div class="movie-overlay"><span class="play-icon">▶</span></div>
      <div class="movie-rating">★ {{ rating }}</div>
      <button v-if="removable" class="remove-fav" @click.stop="$emit('remove', movie.movie_id || movie.id)">✕</button>
    </div>
    <div class="movie-info">
      <h4 class="movie-title">{{ movie.title }}</h4>
      <span class="movie-year">{{ year }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useModalStore } from '@/stores/modal'

const props = defineProps({
  movie: { type: Object, required: true },
  removable: { type: Boolean, default: false }
})
defineEmits(['remove'])

const modal = useModalStore()
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=🎬'

const posterUrl = computed(() => {
  const path = props.movie.poster_path
  return path ? `${IMG_BASE}${path}` : PLACEHOLDER
})
const year = computed(() => {
  const d = props.movie.release_date || props.movie.release_year
  return d ? String(d).substring(0, 4) : '—'
})
const rating = computed(() => {
  const r = props.movie.vote_average
  return r ? Number(r).toFixed(1) : '—'
})
function onImgError(e) { e.target.src = PLACEHOLDER }
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.movie-card {
  cursor: pointer; border-radius: $radius; overflow: hidden;
  background: $card; border: 1px solid $border;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    border-color: rgba(255,215,0,0.2);
    .movie-overlay { opacity: 1; }
    .movie-poster img { transform: scale(1.05); }
    .remove-fav { opacity: 1; }
  }
}

.movie-poster {
  position: relative; aspect-ratio: 2/3; overflow: hidden; background: $bg3;
  img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
}

.movie-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity $transition;
}
.play-icon {
  width: 50px; height: 50px; border: 2px solid $gold; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: $gold;
}

.movie-rating {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,0.8); padding: 3px 8px;
  border-radius: 6px; font-size: 12px; font-weight: 700; color: $gold;
}

.remove-fav {
  position: absolute; top: 8px; right: 8px;
  background: rgba(229,9,20,0.9); border: none; color: white;
  width: 24px; height: 24px; border-radius: 50%; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity $transition;
}

.movie-info { padding: 10px 12px; }
.movie-title {
  font-size: 13px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;
}
.movie-year { font-size: 12px; color: $text3; }
</style>
