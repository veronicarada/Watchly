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

        <!-- Voting -->
        <div v-if="voteMovie" class="group-vote">
          <p class="voting-label">VOTANDO AHORA</p>
          <div class="vote-movie">
            <img :src="posterUrl(voteMovie)" :alt="voteMovie.title"/>
            <div>
              <h4>{{ voteMovie.title }}</h4>
              <div class="vote-bar"><div class="vote-progress" :style="`width:${votePercent}%`"/></div>
              <p>{{ yesVotes }} de {{ totalMembers }} votos</p>
            </div>
          </div>
          <div class="vote-buttons">
            <button class="btn-yes" @click="castVote('yes')">✓ QUIERO VERLA</button>
            <button class="btn-no"  @click="castVote('no')">✕ PASO</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore }  from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'

const auth  = useAuthStore()
const modal = useModalStore()
const toast = useToastStore()

const currentGroup = ref(null)
const joinCode     = ref('')
const voteMovie    = ref(null)
const colors = ['#FFD700','#FF6B6B','#4ECDC4','#A29BFE','#FD79A8']

const IMG_BASE    = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=🎬'
const posterUrl = (m) => m?.poster_path ? `${IMG_BASE}${m.poster_path}` : PLACEHOLDER

const totalMembers = computed(() => currentGroup.value?.members?.length || 1)
const yesVotes = computed(() => {
  if (!voteMovie.value || !currentGroup.value?.votes) return 0
  const v = currentGroup.value.votes[voteMovie.value.id] || {}
  return Object.values(v).filter(x => x === 'yes').length
})
const votePercent = computed(() => Math.round((yesVotes.value / totalMembers.value) * 100))

async function createRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  try { currentGroup.value = await api.createGroup() }
  catch (err) { toast.show(err.message, 'error') }
}

async function joinRoom() {
  if (!auth.isLoggedIn) { modal.openAuth('login'); return }
  if (!joinCode.value) return
  try { currentGroup.value = await api.joinGroup(joinCode.value) }
  catch (err) { toast.show(err.message, 'error') }
}

async function pickMovie() {
  try { voteMovie.value = await api.random() }
  catch { toast.show('Error al obtener película', 'error') }
}

async function castVote(vote) {
  if (!currentGroup.value || !voteMovie.value) return
  try {
    const result = await api.voteMovie(currentGroup.value.code, voteMovie.value.id, vote)
    if (result.match) {
      toast.show('🎉 ¡MATCH! Todos quieren ver esta película!', 'success')
      modal.openMovie(voteMovie.value.id)
    } else {
      toast.show(vote === 'yes' ? '👍 Votaste que sí!' : '👎 Pasaste esta película', 'info')
    }
    currentGroup.value = await api.getGroup(currentGroup.value.code)
  } catch (err) { toast.show(err.message, 'error') }
}

function leaveGroup() { currentGroup.value = null; voteMovie.value = null; toast.show('Saliste del grupo', 'info') }
function copyCode() { navigator.clipboard.writeText(currentGroup.value.code); toast.show('Código copiado 📋', 'success') }
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
.group-members { margin-bottom: 24px;
  .label { font-size: 11px; letter-spacing: 2px; color: $text2; text-transform: uppercase; display: block; margin-bottom: 12px; }
}
.avatars { display: flex; gap: 8px; flex-wrap: wrap; }
.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #000;
}
.add-avatar { background: $bg3 !important; color: $text3 !important; border: 1px dashed $border; font-size: 18px; }
.group-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.group-vote {
  background: $bg3; border: 1px solid $border; border-radius: $radius; padding: 24px;
  .voting-label { font-size: 11px; letter-spacing: 2px; color: $text2; text-transform: uppercase; margin-bottom: 12px; }
}
.vote-movie { display: flex; gap: 14px; align-items: center; margin-bottom: 20px;
  img { width: 50px; border-radius: 6px; }
  h4 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  p { font-size: 12px; color: $text3; }
}
.vote-bar { background: $bg4; border-radius: 4px; height: 4px; overflow: hidden; margin-bottom: 4px; }
.vote-progress { background: $gold; height: 100%; border-radius: 4px; transition: width 0.4s; }
.vote-buttons { display: flex; gap: 10px; }
.btn-yes { flex: 1; padding: 12px; background: $green; color: #000; font-weight: 700; font-size: 14px; border-radius: $radius-sm; border: none; font-family: $font-body; cursor: pointer; }
.btn-no  { flex: 1; padding: 12px; background: $red;   color: #fff; font-weight: 700; font-size: 14px; border-radius: $radius-sm; border: none; font-family: $font-body; cursor: pointer; }
</style>
