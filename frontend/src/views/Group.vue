<template>
  <div class="section-content">
    <!-- Lobby -->
    <template v-if="!currentGroup">
      <div class="group-lobby">
        <h2>MODO GRUPO</h2>
        <p>Votá con amigos. Cuando todos coincidan, ¡hay match!</p>
        <div class="group-options">
          <div class="group-card">
            <div class="icon">🎬</div>
            <h4>Crear sala</h4>
            <p>Generá un código y compartilo con tus amigos</p>
            <button class="btn-primary" @click="createRoom">CREAR SALA</button>
          </div>
          <div class="group-card">
            <div class="icon">👥</div>
            <h4>Unirse a sala</h4>
            <p>Ingresá el código que te compartieron</p>
            <input v-model="joinCode" type="text" placeholder="WATCH-123" class="code-input" maxlength="9"/>
            <button class="btn-primary" @click="joinRoom">UNIRSE</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Active group -->
    <template v-else>
      <div class="group-active">
        <div class="group-code-display">
          <p>TU CÓDIGO DE SALA</p>
          <h2 class="room-code">{{ currentGroup.code }}</h2>
          <button class="btn-copy" @click="copyCode">Compartilo con tus amigos</button>
        </div>

        <div class="group-members">
          <span class="label">MIEMBROS ({{ currentGroup.members?.length || 0 }}/5)</span>
          <div class="avatars">
            <div v-for="(m, i) in currentGroup.members?.slice(0,5)" :key="m" class="avatar" :style="`background:${colors[i]}`">
              {{ String(m).substring(0,2).toUpperCase() }}
            </div>
            <div v-if="(currentGroup.members?.length || 0) < 5" class="avatar add-avatar">+</div>
          </div>
        </div>

        <div class="group-actions">
          <button class="btn-primary" @click="pickMovie">🎬 Elegir película para votar</button>
          <button class="btn-ghost" @click="leaveGroup">Salir del grupo</button>
        </div>

<div v-if="voteMovie" class="tinder-container">
          <div class="tinder-card">
            <div class="card-visual">
              <img :src="posterUrl(voteMovie)" :alt="voteMovie.title"/>
              
              <div class="card-info-overlay">
                <div class="tags">
                  <span v-for="g in voteMovie.genres?.slice(0,2)" :key="g.id" class="tag">
                    {{ g.name }}
                  </span>
                </div>
                
                <h3>{{ voteMovie.title }}</h3>
                
                <div class="meta">
                  <span class="rating">★ {{ voteMovie.vote_average?.toFixed(1) }}</span>
                  <span v-if="voteMovie.runtime" class="runtime">• {{ voteMovie.runtime }} min</span>
                </div>
              </div>
            </div>

            <div class="card-desc">
              <p>{{ voteMovie.overview?.substring(0, 140) }}...</p>
            </div>

            <div class="swipe-actions">
              <button class="btn-swipe pass" @click="castVote('no')">
                <span class="icon">✕</span> PASO
              </button>
              <button class="btn-swipe like" @click="castVote('yes')">
                <span class="icon">✓</span> QUIERO VERLA
              </button>
            </div>
          </div>
          
          <div class="vote-status">
            <p>{{ yesVotes }} de {{ totalMembers }} votos positivos</p>
            <div class="progress-bar">
              <div class="fill" :style="`width:${votePercent}%`"/>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const auth = useAuthStore()
const modal = useModalStore()
const toast = useToastStore()

const currentGroup = ref(null)
const joinCode = ref('')
const voteMovie = ref(null)
const polling = ref(null)

const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A29BFE', '#FD79A8']
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=🎬'
const posterUrl = (m) => m?.poster_path ? `${IMG_BASE}${m.poster_path}` : PLACEHOLDER

// --- Lógica de Sincronización (Polling) ---

async function refreshGroupStatus() {
  if (!currentGroup.value) return
  try {
    const data = await api.getGroup(currentGroup.value.code)
    currentGroup.value = data
    
    // Si el servidor indica una película activa diferente, la actualizamos automáticamente
    if (data.active_movie_id && (!voteMovie.value || voteMovie.value.id !== data.active_movie_id)) {
      const movieData = await api.movieDetail(data.active_movie_id)
      voteMovie.value = movieData
    }
  } catch (err) {
    console.error("Error de sincronización:", err)
  }
}

onMounted(() => {
  if (currentGroup.value) {
    polling.value = setInterval(refreshGroupStatus, 3000)
  }
})

onUnmounted(() => {
  if (polling.value) clearInterval(polling.value)
})

// --- Acciones de Sala ---

const totalMembers = computed(() => currentGroup.value?.members?.length || 1)
const yesVotes = computed(() => {
  if (!voteMovie.value || !currentGroup.value?.votes) return 0
  const v = currentGroup.value.votes[voteMovie.value.id] || {}
  return Object.values(v).filter(x => x === 'yes').length
})
const votePercent = computed(() => Math.round((yesVotes.value / totalMembers.value) * 100))

async function createRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  try { 
    currentGroup.value = await api.createGroup()
    polling.value = setInterval(refreshGroupStatus, 3000)
  }
  catch (err) { toast.show(err.message, 'error') }
}

async function joinRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  if (!joinCode.value) return
  try { 
    currentGroup.value = await api.joinGroup(joinCode.value)
    polling.value = setInterval(refreshGroupStatus, 3000)
  }
  catch (err) { toast.show(err.message, 'error') }
}

async function pickMovie() {
  try { 
    // Al elegir una, el backend la asigna como 'active_movie_id'
    const movie = await api.random()
    voteMovie.value = movie
    // Aquí podrías avisar al backend que esta es la película activa si tu API lo requiere
  }
  catch { toast.show('Error al obtener película', 'error') }
}

async function castVote(vote) {
  if (!currentGroup.value || !voteMovie.value) return
  
  // EFECTO VISUAL: Buscamos el elemento de la carta para aplicar la clase de swipe
  const card = document.querySelector('.tinder-card')
  if (vote === 'yes') {
    card?.classList.add('swipe-right')
  } else {
    card?.classList.add('swipe-left')
  }

  try {
    const result = await api.voteMovie(currentGroup.value.code, voteMovie.value.id, vote)
    
    // Esperamos un momento para que termine la animación antes de cambiar la peli
    setTimeout(async () => {
      if (result.match) {
        toast.show('🎉 ¡MATCH! Todos quieren ver esta película!', 'success')
        modal.openMovie(voteMovie.value.id)
      } else {
        // CAMBIO AUTOMÁTICO: Si no hay match, pedimos la siguiente película de una
        await pickMovie()
      }
      
      // Limpiamos las clases de animación para que la nueva carta aparezca en el centro
      card?.classList.remove('swipe-right', 'swipe-left')
    }, 400)

  } catch (err) { 
    toast.show(err.message, 'error')
    card?.classList.remove('swipe-right', 'swipe-left')
  }
}

function leaveGroup() { 
  if (polling.value) clearInterval(polling.value)
  currentGroup.value = null
  voteMovie.value = null
  toast.show('Saliste del grupo', 'info') 
}

function copyCode() { 
  navigator.clipboard.writeText(currentGroup.value.code)
  toast.show('Código copiado 📋', 'success') 
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

// --- Estilos Base de la Sala (Lobby y Código) ---
.group-lobby { max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 0;
  h2 { font-family: $font-display; font-size: 40px; letter-spacing: 2px; margin-bottom: 12px; }
  p { color: $text2; margin-bottom: 40px; }
}
.group-options { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}
.group-card {
  background: $bg3; border: 1px solid $border; border-radius: $radius; padding: 28px 20px; text-align: center;
  transition: border-color $transition, transform $transition;
  &:hover { border-color: $gold; transform: translateY(-2px); }
  .icon { font-size: 32px; margin-bottom: 12px; }
  h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  p { font-size: 13px; color: $text2; margin-bottom: 16px; }
  .btn-primary { width: 100%; }
}
.code-input {
  width: 100%; padding: 12px; margin-bottom: 12px;
  background: $bg4; border: 1px solid $border; border-radius: $radius-sm;
  color: $text; font-size: 15px; text-align: center; letter-spacing: 2px; text-transform: uppercase;
  font-family: $font-body; outline: none;
  &:focus { border-color: $gold; }
}
.group-active { max-width: 500px; margin: 0 auto; padding: 20px 0; }

// --- Estilos de la Tarjeta Tinder (NUEVO) ---
.tinder-container {
  display: flex; flex-direction: column; align-items: center; gap: 24px; margin-top: 10px;
}

.tinder-card {
  width: 100%; max-width: 360px; background: $bg3; border-radius: 24px;
  overflow: hidden; border: 1px solid $border; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  
  .card-visual {
    position: relative; aspect-ratio: 2/3;
    img { width: 100%; height: 100%; object-fit: cover; }
    
    .card-info-overlay {
      position: absolute; inset: 0; padding: 24px;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 5%, rgba(0,0,0,0.4) 40%, transparent 70%);
      display: flex; flex-direction: column; justify-content: flex-end;
      
      h3 { font-family: $font-display; font-size: 28px; color: #fff; line-height: 1.1; margin-bottom: 8px; }
      
      .meta { display: flex; gap: 12px; font-size: 14px; color: $gold; font-weight: 700; }
      
      .tags { display: flex; gap: 6px; margin-bottom: 10px;
        .tag { font-size: 10px; text-transform: uppercase; background: rgba($gold, 0.2); 
               padding: 4px 10px; border-radius: 6px; color: $gold; border: 1px solid rgba($gold, 0.3); }
      }
    }
  }

  .card-desc { padding: 20px; background: $bg3; 
    p { font-size: 14px; color: $text2; line-height: 1.5; margin: 0; }
  }
}

.swipe-actions {
  display: flex; gap: 1px; background: $border;
  .btn-swipe {
    flex: 1; padding: 20px; font-weight: 800; border: none; font-size: 12px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer; transition: $transition;
    
    &.pass { background: $bg2; color: $red; }
    &.like { background: $gold; color: #000; }
    &:active { transform: scale(0.95); }
    .icon { font-size: 16px; }
  }
}

// --- Progreso de Votación ---
.vote-status {
  width: 100%; max-width: 360px;
  p { font-size: 12px; text-align: center; color: $text3; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  .progress-bar { background: $bg4; height: 6px; border-radius: 10px; overflow: hidden; 
    .fill { background: $gold; height: 100%; transition: width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  }
}

// --- Otros estilos existentes (Avatar y Código) ---
.group-code-display {
  background: $bg3; border: 2px dashed $gold; border-radius: $radius;
  padding: 28px; text-align: center; margin-bottom: 24px;
  p { font-size: 11px; letter-spacing: 2px; color: $text2; margin-bottom: 10px; text-transform: uppercase; }
}
.room-code { font-family: $font-display; font-size: 52px; color: $gold; letter-spacing: 4px; }
.btn-copy {
  margin-top: 12px; background: transparent; border: 1px solid $border; color: $text2;
  padding: 8px 20px; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all $transition;
  &:hover { border-color: $gold; color: $gold; }
}
.avatars { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #000;
}
.tinder-card {
  transition: transform 0.4s ease, opacity 0.4s ease;
  // ... (tus estilos anteriores)
}

.swipe-right {
  transform: translateX(150%) rotate(20deg) !important;
  opacity: 0;
}

.swipe-left {
  transform: translateX(-150%) rotate(-20deg) !important;
  opacity: 0;
}
</style>
