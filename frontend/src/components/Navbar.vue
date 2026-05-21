<template>
  <nav class="navbar">
    <div class="navbar-logo" @click="router.push('/')">
      <span class="logo-icon">◉</span>
      <span class="logo-watch">WATCH</span><span class="logo-ly">LY</span>
    </div>

    <div class="navbar-center">
      <RouterLink to="/"          class="nav-pill">Inicio</RouterLink>
      <RouterLink to="/explorar"  class="nav-pill">Explorar</RouterLink>
      <RouterLink to="/sorpresa"  class="nav-pill">Sorprendeme</RouterLink>
      <RouterLink to="/favoritas" class="nav-pill">Mi lista</RouterLink>
      <RouterLink to="/grupo"     class="nav-pill">Grupo</RouterLink>
    </div>

    <div class="navbar-right">
      <template v-if="!auth.isLoggedIn">
        <button class="btn-login"    @click="openAuth('login')">Ingresar</button>
        <button class="btn-register" @click="openAuth('register')">Registrarse</button>

      </template>
      <template v-else>
        <div class="user-info">
 
        <div class="user-avatar" @click="router.push('/perfil')" style="cursor:pointer">{{ userAvatar || auth.user?.username?.[0]?.toUpperCase() }}</div>    

<span class="username" @click="router.push('/perfil')" style="cursor:pointer">{{ auth.user?.username }}</span>
          <!-- Dropdown de tema -->
          <div class="theme-menu" :class="{ open: themeOpen }">
           <button class="theme-trigger" @click.stop="themeOpen = !themeOpen" title="Cambiar tema">
              <span v-if="theme.mode === 'light'" class="icon-sun">☀</span>
              <span v-else-if="theme.mode === 'dark'" class="icon-moon">☾</span>
              <span v-else class="icon-auto"></span>
           </button>
           <div class="theme-dropdown" v-if="themeOpen">
             <button @click="setTheme('light')" :class="{ active: theme.mode === 'light' }"><span class="icon-sun">☀</span> Claro</button>
             <button @click="setTheme('dark')"  :class="{ active: theme.mode === 'dark' }"><span class="icon-moon">☾</span> Oscuro</button>
             <button @click="setTheme('auto')"  :class="{ active: theme.mode === 'auto' }"><span class="icon-auto"></span> Automático</button>
           </div>
          </div>

          <button class="btn-logout" @click="handleLogout">Salir</button>
        </div>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useModalStore } from '@/stores/modal'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
const router   = useRouter()
const auth     = useAuthStore()
const toast    = useToastStore()
const modal    = useModalStore()
const themeOpen = ref(false)
const userAvatar = ref(localStorage.getItem('watchly_avatar') || '') 

function openAuth(tab) { modal.openAuth(tab) }
function setTheme(mode) {
  theme.setMode(mode)
  themeOpen.value = false
}

function handleLogout() {
  auth.logout()
  toast.show('Sesión cerrada', 'info')
  router.push('/')
}

function closeOnOutside(e) {
  if (!e.target.closest('.theme-menu')) themeOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', closeOnOutside)
  window.addEventListener('avatar-updated', () => {
    userAvatar.value = localStorage.getItem('watchly_avatar') || ''
  })
})
onUnmounted(() => {
  document.removeEventListener('click', closeOnOutside)
})
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--bg2);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid $border;
  height: 60px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
}

.navbar-logo {
  font-family: $font-display;
  font-size: 26px; letter-spacing: 2px;
  display: flex; align-items: center; gap: 6px;
  cursor: pointer;
  .logo-ly { color: $gold; }
}

.navbar-center {
  display: flex; gap: 4px;
  .nav-pill {
    padding: 6px 16px; border-radius: 20px;
    font-size: 13px; font-weight: 500;
    color: $text2; background: transparent;
    transition: $transition; text-decoration: none;
    &:hover, &.router-link-active { background: $bg3; color: $gold; }
  }
}

.navbar-right { display: flex; align-items: center; gap: 12px; }

.btn-login {
  padding: 6px 18px; border-radius: 20px;
  border: 1px solid $border; background: transparent;
  color: $text2; font-size: 13px; font-weight: 500;
  transition: $transition;
  &:hover { border-color: $gold; color: $gold; }
}
.btn-register {
  padding: 7px 18px; border-radius: 20px;
  background: $gold; color: #000;
  font-size: 13px; font-weight: 700; transition: $transition;
  &:hover { background: $gold2; }
}

.user-info { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: $bg3; border: 1px solid $border;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: $text;
}
.username { font-size: 14px; font-weight: 600; }
.btn-logout {
  padding: 6px 12px; border-radius: 20px;
  background: $bg3; color: $text2;
  font-size: 12px; border: 1px solid $border; transition: $transition;
  &:hover { color: $red; border-color: $red; }
}
.btn-theme {
  width: 36px; height: 36px; border-radius: 50%;
  background: $bg3; border: 1px solid $border;
  font-size: 16px; display: flex; align-items: center; justify-content: center;
  transition: $transition;
  &:hover { border-color: $gold; transform: scale(1.1); }
}

/* ← esto es lo nuevo */
.theme-menu {
  position: relative;
}
.theme-trigger {
  width: 32px; height: 32px; border-radius: 50%;
  background: $bg3; border: 1px solid $border;
  font-size: 15px; display: flex; align-items: center; justify-content: center;
  transition: $transition;
  &:hover { border-color: $gold; transform: scale(1.1); }
}
.theme-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: $bg2; border: 1px solid $border;
  border-radius: $radius-sm; overflow: hidden;
  box-shadow: $shadow; min-width: 150px; z-index: 200;

  button {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 9px 16px;
    font-size: 13px; color: $text2;
    background: transparent; border: none; cursor: pointer;
    transition: $transition;
    &:hover { background: $bg3; color: $text; }
    &.active { color: $gold; font-weight: 600; }
  }
}

@media (max-width: 768px) { .navbar-center { display: none; } }
</style>
