<template>
  <div class="section-content">
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

    <template v-else>
      <div class="group-active">
        <div class="group-code-display">
          <p>TU CÓDIGO DE SALA</p>
          <div class="code-row">
            <h2 class="room-code">{{ currentGroup.code }}</h2>
            <button class="btn-icon-copy" @click="copyInviteLink" title="Copiar link directo">🔗</button>
          </div>
          <button class="btn-copy" @click="copyCode">Copiar código solo</button>
        </div>

        <div class="group-members">
          <span class="label">MIEMBROS ({{ currentGroup.members?.length || 0 }}/5)</span>
          <div class="avatars">
            <div v-for="(m, i) in currentGroup.members?.slice(0,5)" :key="m" class="avatar" :style="`background:${colors[i % colors.length]}`">
              {{ String(m).substring(0,2).toUpperCase() }}
            </div>
            <div v-if="(currentGroup.members?.length || 0) < 5" class="avatar add-avatar">+</div>
          </div>
        </div>

        <div v-if="currentGroup.status === 'proposing'" class="phase-container">
          <div class="phase-header">
            <h3>Noche de Cine: Propuestas</h3>
            <p>{{ currentGroup.proposals?.length || 0 }} de {{ currentGroup.members.length }} propuestas enviadas</p>
          </div>
          <div v-if="!hasUserProposed" class="proposal-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Busca la peli que querés proponer..."
              class="code-input"
              @input="handleSearch"
            />
            <div v-if="searchResults.length" class="search-results-dropdown">
              <div v-for="movie in searchResults" :key="movie.id" class="search-result-item" @click="selectProposal(movie)">
                <img :src="posterUrl(movie)" class="mini-poster" />
                <span>{{ movie.title }} ({{ movie.release_date?.substring(0,4) }})</span>
              </div>
            </div>
          </div>
          <div v-else class="status-msg">
            <p>✅ Tu propuesta fue enviada. Esperando a los demás...</p>
          </div>
          <button
            v-if="allMembersProposed || currentGroup.proposals?.length >= 1"
            class="btn-primary mt-20"
            @click="startVotingPhase"
          >
            COMENZAR VOTACIÓN
          </button>
        </div>

        <div v-else-if="currentGroup.status === 'voting'" class="group-actions-container">
          <div v-if="!currentProposalMovie" class="empty-voting">
            <p>Preparando las películas elegidas...</p>
          </div>
          <div v-else class="tinder-container">
            <div class="tinder-card">
              <div class="card-visual">
                <img :src="posterUrl(currentProposalMovie)" :alt="currentProposalMovie.title"/>
                <div class="card-info-overlay">
                  <h3>{{ currentProposalMovie.title }}</h3>
                </div>
              </div>
              <div class="card-desc">
                <p style="text-align: center; font-weight: 500;">
                  Película {{ currentVoteIndex + 1 }} de {{ currentGroup.proposals.length }}
                </p>
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
          </div>
        </div>

        <div v-else-if="currentGroup.status === 'finished'" class="phase-finished">
          <div v-if="voteMovie" class="tinder-card winner-card">
            <div class="match-banner">🎉 ¡HAY MATCH! 🎉</div>
            <img :src="posterUrl(voteMovie)" class="winner-poster" />
            <div class="card-desc">
              <h3>{{ voteMovie.title }}</h3>
              <p v-if="voteMovie.overview">{{ voteMovie.overview.substring(0, 140) }}...</p>
              <p v-else>Esta es la elegida para hoy.</p>
              
              <a :href="'https://www.justwatch.com/ar/buscar?q=' + encodeURIComponent(voteMovie.title)"
                target="_blank"
                class="btn-primary"
                style="display: block; text-align: center; text-decoration: none; margin-top: 15px;">
                VER EN PLATAFORMA
              </a>
              <Transition name="snack-fade">
                <div v-if="showSnackBanner" class="snack-banner">
                   <button class="snack-close" @click="showSnackBanner = false">✕</button>
                  <p class="snack-title">🍿 Que te lleven tus snacks favoritos</p>
                  <p class="snack-sub">Pochoclos, golosinas y bebidas — llegando mientras empieza la peli.</p>
                  <div class="snack-btns">
                   <a href="https://www.pedidoya.com.ar/buscar?q=snacks" target="_blank" class="snack-btn pedidoya">🛵 PedidoYa</a>
                   <a href="https://www.rappi.com.ar/buscar?query=pochoclos" target="_blank" class="snack-btn rappi">🛵 Rappi</a>
                   <a href="https://www.ubereats.com/ar/search?q=snacks" target="_blank" class="snack-btn ubereats">🛵 Uber Eats</a>
                 </div>
                </div>
              </Transition>
            </div>
          </div>
          <div v-else class="empty-voting">
            <p>Hubo un empate de votos positivos entre las propuestas.</p>
            <button class="btn-primary" @click="triggerTieBreaker">
              🎲 ELEGIR POR MÍ (AL AZAR)
            </button>
          </div>
        </div>

        <div class="group-footer-actions">
          <button class="btn-ghost" @click="leaveGroup">Salir del grupo</button>
        </div>
      </div>

      <!-- CHAT DEL GRUPO -->
      <div
        class="group-chat"
        :class="{ minimized: chatMinimized, dragging: isDragging }"
        :style="{ left: chatPos.x + 'px', top: chatPos.y + 'px', bottom: 'auto' }"
        ref="chatWidget"
      >
        <div class="chat-header" @mousedown="startDrag" @click="chatMinimized = !chatMinimized">
          <span>💬 Chat del grupo</span>
          <div style="display:flex; gap:8px; align-items:center">
            <button class="chat-popout-btn" @click.stop="popoutChat" title="Abrir en ventana">⤢</button>
            <span class="chat-toggle">{{ chatMinimized ? '▲' : '▼' }}</span>
          </div>
        </div>

        <template v-if="!chatMinimized">
          <div class="chat-messages" ref="chatEl">
            <div v-if="chatMessages.length === 0" class="chat-empty">
              Nadie habló todavía. ¡Rompé el hielo! 🎬
            </div>
            <div
              v-for="(msg, i) in chatMessages"
              :key="i"
              class="chat-msg"
              :class="{ mine: msg.username === (auth.user?.username || auth.user?.email?.split('@')[0]) }"
            >
              <span class="chat-user">{{ msg.username }}</span>
              <span class="chat-bubble">{{ msg.text }}</span>
            </div>
          </div>

          <div class="chat-input-row">
            <input
              v-model="chatInput"
              @keydown.enter="sendMessage"
              placeholder="Escribí algo..."
              class="chat-input-field"
            />
            <button @click="sendMessage" class="chat-send">➤</button>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'
import { io } from 'socket.io-client'

const auth = useAuthStore()
const modal = useModalStore()
const toast = useToastStore()

const currentGroup = ref(null)
const joinCode = ref('')
const route = useRoute()

// --- Chat ---
const chatMessages = ref([])
const chatInput = ref('')
const chatMinimized = ref(false)
const chatEl = ref(null)
const chatWidget = ref(null)
const isDragging = ref(false)
const chatPos = ref({ x: 20, y: window.innerHeight - 380 })
let dragOffset = { x: 0, y: 0 }
let socket = null
let popoutWindow = null

function startDrag(e) {
  if (e.target.closest('.chat-input-row') || e.target.closest('.chat-messages')) return
  isDragging.value = true
  dragOffset.x = e.clientX - chatPos.value.x
  dragOffset.y = e.clientY - chatPos.value.y
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  chatPos.value.x = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x))
  chatPos.value.y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y))
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

function popoutChat() {
  const code = currentGroup.value?.code
  if (!code) return
  const username = auth.user?.username || auth.user?.email?.split('@')[0] || 'Anónimo'
  const url = `${window.location.origin}/group-chat?code=${code}&username=${encodeURIComponent(username)}`
  popoutWindow = window.open(
    url,
    'watchly-chat',
    'width=320,height=520,resizable=yes,toolbar=no,location=no,menubar=no,status=no,titlebar=no,chrome=no'
  )
}

function initSocket(code) {
  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
  socket = io(SOCKET_URL)
  const username = auth.user?.username || auth.user?.email?.split('@')[0] || 'Anónimo'
  socket.emit('join-room', { code, username })

  socket.on('message-history', (msgs) => {
    chatMessages.value = msgs
    scrollChat()
  })
  socket.on('new-message', (msg) => {
    chatMessages.value.push(msg)
    scrollChat()
  })
  socket.on('user-joined', ({ username: u }) => {
    chatMessages.value.push({ username: '🎬 Sistema', text: `${u} se unió al grupo` })
    scrollChat()
  })
  socket.on('user-left', ({ username: u }) => {
    const myUsername = auth.user?.username || auth.user?.email?.split('@')[0] || 'Anónimo'
    if (u === myUsername) return  // ignorar si soy yo mismo
    chatMessages.value.push({ username: '🎬 Sistema', text: `${u} salió del grupo` })
    scrollChat()
  })
}

function sendMessage() {
  if (!chatInput.value.trim() || !socket || !currentGroup.value) return
  const username = auth.user?.username || auth.user?.email?.split('@')[0] || 'Anónimo'
  socket.emit('send-message', { code: currentGroup.value.code, username, text: chatInput.value.trim() })
  chatInput.value = ''
}

async function scrollChat() {
  await nextTick()
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
}

function disconnectSocket(code) {
  if (socket) {
    const username = auth.user?.username || auth.user?.email?.split('@')[0] || 'Anónimo'
    socket.emit('leave-room', { code, username })
    socket.disconnect()
    socket = null
  }
}

onMounted(async () => {
  const codeFromUrl = route.params.code
  const pendingCode = localStorage.getItem('watchly_pending_join')
  const code = codeFromUrl || pendingCode
  if (code && auth.isLoggedIn) {
    localStorage.removeItem('watchly_pending_join')
    joinCode.value = code
    await joinRoom()
  } else if (code && !auth.isLoggedIn) {
    localStorage.setItem('watchly_pending_join', code)
    modal.openAuth('login')
  }
})

const voteMovie = ref(null)
const polling = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const currentVoteIndex = ref(0)
const showSnackBanner = ref(false)

const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A29BFE', '#FD79A8']
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=🎬'
const posterUrl = (m) => m?.poster_path ? `${IMG_BASE}${m.poster_path}` : PLACEHOLDER

const hasUserProposed = computed(() => {
  if (!currentGroup.value?.proposals || !auth.user) return false
  return currentGroup.value.proposals.filter(p => p.user_id === auth.user.id).length >= 3
})

const allMembersProposed = computed(() => {
  if (!currentGroup.value) return false
  const proposalsCount = currentGroup.value.proposals?.length || 0
  const expectedProposals = (currentGroup.value.members?.length || 1) * 3
  return proposalsCount >= expectedProposals
})

const currentProposalMovie = computed(() => {
  if (!currentGroup.value?.proposals || currentGroup.value.proposals.length === 0) return null
  return currentGroup.value.proposals[currentVoteIndex.value] || null
})

const totalMembers = computed(() => currentGroup.value?.members?.length || 1)

async function refreshGroupStatus() {
  if (!currentGroup.value) return
  try {
    const data = await api.getGroup(currentGroup.value.code)
    const oldStatus = currentGroup.value.status
    currentGroup.value = data
    if (oldStatus !== data.status && data.status === 'voting') {
      currentVoteIndex.value = 0
      toast.show('🎬 ¡Comenzó la votación!', 'info')
    }
    if (data.active_movie_id) {
     if (!voteMovie.value || voteMovie.value.id !== data.active_movie_id) {
      voteMovie.value = await api.movieDetail(data.active_movie_id)
      showSnackBanner.value = true
     }
    } else {
      voteMovie.value = null
    }
  } catch (err) {
    console.error('Error de sincronización:', err)
  }
}

function startPolling() {
  if (polling.value) clearInterval(polling.value)
  polling.value = setInterval(refreshGroupStatus, 3000)
}

onUnmounted(() => {
  if (polling.value) clearInterval(polling.value)
  if (currentGroup.value) disconnectSocket(currentGroup.value.code)
})

async function handleSearch() {
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  isSearching.value = true
  try {
    const data = await api.search(searchQuery.value)
    searchResults.value = data.results || []
  } catch { toast.show('Error al buscar películas', 'error') }
  finally { isSearching.value = false }
}

async function selectProposal(movie) {
  if (!currentGroup.value) return
  try {
    currentGroup.value = await api.proposeMovie(currentGroup.value.code, movie.id, movie.title, movie.poster_path)
    searchQuery.value = ''
    searchResults.value = []
    toast.show('🚀 ¡Propuesta enviada!', 'success')
  } catch (err) { toast.show(err.message, 'error') }
}

async function startVotingPhase() {
  if (!currentGroup.value) return
  try {
    currentGroup.value = await api.updateStatus(currentGroup.value.code, 'voting')
    currentVoteIndex.value = 0
    toast.show('🔥 ¡Votación iniciada!', 'success')
  } catch (err) { toast.show(err.message || 'Error', 'error') }
}

async function createRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  try {
    currentGroup.value = await api.createGroup()
    startPolling()
    initSocket(currentGroup.value.code)
  } catch (err) { toast.show(err.message, 'error') }
}

async function joinRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  if (!joinCode.value) return
  try {
    currentGroup.value = await api.joinGroup(joinCode.value)
    startPolling()
    initSocket(currentGroup.value.code)
  } catch (err) { toast.show(err.message, 'error') }
}

async function castVote(vote) {
  if (!currentGroup.value || !currentProposalMovie.value) return
  const card = document.querySelector('.tinder-card')
  card?.classList.add(vote === 'yes' ? 'swipe-right' : 'swipe-left')
  try {
    const activeMovieId = currentProposalMovie.value.movie_id
    const result = await api.voteMovie(currentGroup.value.code, activeMovieId, vote)
    setTimeout(async () => {
      card?.classList.remove('swipe-right', 'swipe-left')
      if (result.match) {
        toast.show('🎉 ¡MATCH!', 'success')
        await refreshGroupStatus()
        modal.openMovie(activeMovieId)
      } else if (currentVoteIndex.value < currentGroup.value.proposals.length - 1) {
        currentVoteIndex.value++
      } else {
        currentGroup.value = await api.updateStatus(currentGroup.value.code, 'finished')
        toast.show('Ronda terminada. ¡Calculando resultados!', 'info')
      }
    }, 400)
  } catch (err) {
    toast.show(err.message, 'error')
    document.querySelector('.tinder-card')?.classList.remove('swipe-right', 'swipe-left')
  }
}

async function triggerTieBreaker() {
  if (!currentGroup.value) return
  try {
    currentGroup.value = await api.resolveTieBreaker(currentGroup.value.code)
    toast.show('🎲 El azar decidió.', 'success')
  } catch (err) { toast.show(err.message, 'error') }
}

function leaveGroup() {
  if (polling.value) clearInterval(polling.value)
  if (currentGroup.value) disconnectSocket(currentGroup.value.code)
  if (popoutWindow && !popoutWindow.closed) popoutWindow.close()
  currentGroup.value = null
  voteMovie.value = null
  currentVoteIndex.value = 0
  chatMessages.value = []
  toast.show('Saliste del grupo', 'info')
}

function copyCode() {
  navigator.clipboard.writeText(currentGroup.value.code)
  toast.show('Código copiado 📋', 'success')
}

function copyInviteLink() {
  const url = `${window.location.origin}/join/${currentGroup.value.code}`
  navigator.clipboard.writeText(url)
  toast.show('¡Link copiado! 🔗', 'success')
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

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
.phase-container { display: flex; flex-direction: column; gap: 20px; background: $bg3; padding: 24px; border-radius: 20px; border: 1px solid $border; margin-top: 20px; }
.phase-header { text-align: center;
  h3 { font-family: $font-display; font-size: 22px; color: $gold; margin-bottom: 6px; letter-spacing: 1px; }
  p { font-size: 13px; color: $text2; }
}
.proposal-box { position: relative; width: 100%; }
.search-results-dropdown { position: absolute; top: 105%; left: 0; width: 100%; background: $bg4; border: 1px solid $border; border-radius: $radius-sm; max-height: 240px; overflow-y: auto; z-index: 100; box-shadow: 0 12px 30px rgba(0,0,0,0.6); }
.search-result-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; transition: background $transition; border-bottom: 1px solid rgba(255,255,255,0.05);
  &:hover { background: rgba($gold, 0.1); }
  .mini-poster { width: 35px; height: 50px; object-fit: cover; border-radius: 4px; background: #000; }
  span { font-size: 13px; color: $text; font-weight: 500; }
}
.status-msg { text-align: center; background: rgba(#4ECDC4, 0.1); border: 1px solid #4ECDC4; padding: 16px; border-radius: $radius-sm; color: #4ECDC4; font-weight: 600; font-size: 14px; }
.mt-20 { margin-top: 20px; }
.tinder-container { display: flex; flex-direction: column; align-items: center; gap: 24px; margin-top: 10px; }
.tinder-card {
  width: 100%; max-width: 360px; background: $bg3; border-radius: 24px; overflow: hidden; border: 1px solid $border; box-shadow: 0 20px 40px rgba(0,0,0,0.4); transition: transform 0.4s ease, opacity 0.4s ease;
  .card-visual { position: relative; aspect-ratio: 2/3;
    img { width: 100%; height: 100%; object-fit: cover; }
    .card-info-overlay { position: absolute; inset: 0; padding: 24px; background: linear-gradient(to top, rgba(0,0,0,0.95) 5%, rgba(0,0,0,0.4) 40%, transparent 70%); display: flex; flex-direction: column; justify-content: flex-end;
      h3 { font-family: $font-display; font-size: 28px; color: #fff; line-height: 1.1; margin-bottom: 8px; }
    }
  }
  .card-desc { padding: 20px; background: $bg3; p { font-size: 14px; color: $text2; line-height: 1.5; margin: 0; } }
}
.phase-finished { display: flex; flex-direction: column; align-items: center; width: 100%; }
.match-banner { font-family: $font-display; font-size: 32px; color: $gold; text-align: center; margin-bottom: 20px; letter-spacing: 2px; text-shadow: 0 0 12px rgba($gold, 0.4); }
.winner-card { border: 2px solid $gold !important; box-shadow: 0 0 30px rgba($gold, 0.25);
  .winner-poster { width: 100%; max-height: 380px; object-fit: cover; }
  h3 { font-family: $font-display; font-size: 24px; color: #fff; margin-bottom: 10px; text-align: center; }
}
.swipe-actions { display: flex; gap: 1px; background: $border;
  .btn-swipe { flex: 1; padding: 20px; font-weight: 800; border: none; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: $transition;
    &.pass { background: $bg2; color: $red; }
    &.like { background: $gold; color: #000; }
    &:active { transform: scale(0.95); }
    .icon { font-size: 16px; }
  }
}
.empty-voting { text-align: center; padding: 40px 20px; background: $bg3; border-radius: 20px; border: 1px solid $border; width: 100%;
  p { color: $text2; margin-bottom: 20px; font-size: 15px; }
}
.group-code-display { background: $bg3; border: 2px dashed $gold; border-radius: $radius; padding: 28px; text-align: center; margin-bottom: 24px;
  p { font-size: 11px; letter-spacing: 2px; color: $text2; margin-bottom: 10px; text-transform: uppercase; }
}
.room-code { font-family: $font-display; font-size: 52px; color: $gold; letter-spacing: 4px; }
.btn-copy { margin-top: 12px; background: transparent; border: 1px solid $border; color: $text2; padding: 8px 20px; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all $transition; &:hover { border-color: $gold; color: $gold; } }
.code-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
.btn-icon-copy { background: transparent; border: 1px solid $border; font-size: 18px; padding: 8px; border-radius: 50%; cursor: pointer; transition: all $transition; &:hover { border-color: $gold; background: rgba($gold, 0.1); } }
.group-members { margin-bottom: 24px; .label { font-size: 11px; font-weight: 700; color: $text3; letter-spacing: 1px; } }
.avatars { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #000;
  &.add-avatar { background: $bg4; color: $text3; border: 1px dashed $border; font-size: 18px; cursor: pointer; }
}
.group-footer-actions { margin-top: 32px; text-align: center; .btn-ghost { color: $text3; font-size: 13px; &:hover { color: $red; } } }
.swipe-right { transform: translateX(150%) rotate(20deg) !important; opacity: 0; }
.swipe-left { transform: translateX(-150%) rotate(-20deg) !important; opacity: 0; }

// --- CHAT ---
.group-chat {
  position: fixed; z-index: 250; width: 300px;
  background: $bg2; border: 1px solid $border; border-radius: 16px;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  transition: box-shadow 0.2s; cursor: default; user-select: none;
  &.minimized { width: 200px; }
  &.dragging { box-shadow: 0 16px 48px rgba(0,0,0,0.7); }
}
.chat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: $bg3; cursor: grab; border-bottom: 1px solid $border;
  &:active { cursor: grabbing; }
  span { font-size: 13px; font-weight: 700; color: $text; }
  .chat-toggle { color: $gold; font-size: 11px; }
  &:hover { background: $bg4; }
}
.chat-popout-btn {
  background: transparent; border: 1px solid $border; color: $text2;
  border-radius: 6px; padding: 2px 6px; font-size: 13px; cursor: pointer;
  &:hover { border-color: $gold; color: $gold; }
}
.chat-messages { height: 220px; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: $bg4; border-radius: 4px; }
}
.chat-empty { font-size: 12px; color: $text3; text-align: center; margin-top: 60px; }
.chat-msg { display: flex; flex-direction: column; gap: 2px; &.mine { align-items: flex-end; } }
.chat-user { font-size: 10px; color: $text3; font-weight: 600; }
.chat-bubble { background: $bg3; border-radius: 12px; padding: 6px 10px; font-size: 12px; color: $text; max-width: 90%; word-break: break-word;
  .mine & { background: rgba($gold, 0.2); color: $gold; }
}
.chat-input-row { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid $border; }
.chat-input-field { flex: 1; padding: 7px 10px; background: $bg3; border: 1px solid $border; border-radius: 20px; color: $text; font-size: 12px; font-family: $font-body; outline: none;
  &:focus { border-color: $gold; }
}
.chat-send { background: $gold; color: #000; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { opacity: 0.85; } }

.snack-banner {
  width: 100%; margin-top: 16px;
  background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,150,0,0.08));
  border: 1px solid rgba(255,215,0,0.25);
  border-radius: $radius; padding: 16px;
  position: relative;
}
.snack-close {
  position: absolute; top: 10px; right: 10px;
  background: none; border: none; color: $text3;
  cursor: pointer; font-size: 13px;
  &:hover { color: $text; }
}
.snack-title {
  font-size: 14px; font-weight: 700; color: $gold; margin-bottom: 4px;
}
.snack-sub {
  font-size: 12px; color: $text2; margin-bottom: 12px;
}
.snack-btns {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.snack-btn {
  padding: 8px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 700;
  text-decoration: none; transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &.pedidoya { background: #FA0050; color: white; }
  &.rappi { background: #FF441F; color: white; }
  &.ubereats { background: #06C167; color: white; }
}
.snack-fade-enter-active, .snack-fade-leave-active { transition: opacity 0.3s ease; }
.snack-fade-enter-from, .snack-fade-leave-to { opacity: 0; }

</style>