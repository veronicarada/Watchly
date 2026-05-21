<template>
  <div class="profile-page">
    <div class="profile-container">

      <!-- Avatar selector -->
      <div class="avatar-section">
        <div class="avatar-display">{{ selectedAvatar || auth.user?.username?.[0]?.toUpperCase() }}</div>
        <div class="avatar-grid">
          <button
            v-for="a in avatars"
            :key="a"
            class="avatar-option"
            :class="{ active: selectedAvatar === a }"
            @click="selectedAvatar = a"
          >{{ a }}</button>
        </div>
      </div>

      <div class="avatar-actions">
   <button class="btn-save-avatar" @click="saveAvatar">Guardar avatar</button>
     <button class="btn-back" @click="router.push('/')">← Volver al inicio</button>
   </div>

      <!-- Info -->
      <div class="profile-info">
        <div class="form-group">
          <label>NOMBRE DE USUARIO</label>
          <div class="input-row">
            <input v-model="username" type="text" :disabled="!editing"/>
            <button v-if="!editing" class="btn-edit" @click="editing = true">Editar</button>
            <button v-else class="btn-save" @click="saveUsername" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>EMAIL</label>
          <input :value="auth.user.email" disabled/>
        </div>


        <!-- Stats -->
        <div class="stats">
          <div class="stat">
            <span class="stat-number">{{ favCount }}</span>
            <span class="stat-label">Favoritas</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { api } from '@/services/api'
import { useRouter } from 'vue-router'
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const avatars = [' ', '🎬', '🎥', '🎞️', '🍿', '🎭', '⭐', '🏆', '🎦', '📽️', '🎟️']
const selectedAvatar = ref(localStorage.getItem('watchly_avatar') || '🎬')
const username = ref(auth.user.username)
const editing = ref(false)
const saving = ref(false)
const favCount = ref(0)

onMounted(async () => {
  try {
    const favs = await api.getFavorites()
    favCount.value = favs.length
  } catch {}
})
function saveAvatar() {
  localStorage.setItem('watchly_avatar', selectedAvatar.value)
  window.dispatchEvent(new Event('avatar-updated'))
  toast.show('Avatar guardado ✅', 'success')
}

async function saveUsername() {
  saving.value = true
  try {
    const { user } = await api.updateProfile(username.value)
    auth.save(auth.token, { ...auth.user, username: user.username })
    localStorage.setItem('watchly_avatar', selectedAvatar.value)
    editing.value = false
    toast.show('Perfil actualizado ✅', 'success')
  } catch (err) {
    toast.show(err.message, 'error')
  } finally {
    saving.value = false
  }
}

</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.profile-page {
  min-height: 100vh; padding: 60px 20px;
  display: flex; justify-content: center;
}

.profile-container {
  width: 100%; max-width: 500px;
  display: flex; flex-direction: column; gap: 32px;
}

.avatar-section {
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}

.avatar-display {
  width: 100px; height: 100px; border-radius: 50%;
  background: $bg2; border: 2px solid $gold;
  display: flex; align-items: center; justify-content: center;
  font-size: 48px;
}

.avatar-grid {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
}

.avatar-option {
  width: 48px; height: 48px; border-radius: 50%;
  background: $bg2; border: 2px solid $border;
  font-size: 22px; cursor: pointer; transition: all $transition;
  &:hover { border-color: $gold; }
  &.active { border-color: $gold; background: $bg3; }
}

.profile-info {
  display: flex; flex-direction: column; gap: 20px;
  background: $bg2; border: 1px solid $border;
  border-radius: 16px; padding: 28px;
}

.form-group {
  display: flex; flex-direction: column; gap: 8px;
  label { font-size: 12px; font-weight: 600; color: $text2; letter-spacing: 0.5px; }
}

.input-row {
  display: flex; gap: 8px;
  input { flex: 1; }
}

input {
  padding: 10px 14px; background: $bg3; border: 1px solid $border;
  border-radius: $radius-sm; color: $text; font-size: 14px;
  font-family: $font-body; outline: none; width: 100%;
  transition: border-color $transition;
  &:focus { border-color: $gold; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn-save-avatar {
  padding: 8px 20px; border-radius: $radius-sm;
  background: $gold; color: #000;
  font-size: 13px; font-weight: 700;
  transition: all $transition;
  &:hover { opacity: 0.85; }
}

.btn-edit, .btn-save {
  padding: 10px 16px; border-radius: $radius-sm;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all $transition; white-space: nowrap;
}
.btn-edit { background: $bg3; border: 1px solid $border; color: $text2; &:hover { border-color: $gold; color: $text; } }
.btn-save { background: $gold; border: none; color: #000; &:hover { opacity: 0.85; } &:disabled { opacity: 0.4; } }

.stats {
  display: flex; gap: 20px; padding-top: 8px;
  border-top: 1px solid $border;
}

.stat {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.stat-number { font-size: 28px; font-weight: 700; color: $gold; }
.stat-label { font-size: 12px; color: $text2; }

.avatar-actions {
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
}

.btn-back {
  padding: 8px 20px; border-radius: $radius-sm;
  background: transparent; border: 1px solid $border;
  color: $text2; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all $transition;
  &:hover { border-color: $gold; color: $text; }
}
</style>