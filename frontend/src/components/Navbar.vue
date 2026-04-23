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
      <RouterLink to="/favoritas" class="nav-pill">Favoritas</RouterLink>
      <RouterLink to="/grupo"     class="nav-pill">Grupo</RouterLink>
    </div>

    <div class="navbar-right">
      <template v-if="!auth.isLoggedIn">
        <button class="btn-login"    @click="openAuth('login')">Ingresar</button>
        <button class="btn-register" @click="openAuth('register')">Registrarse</button>
      </template>
      <template v-else>
        <div class="user-info">
          <div class="user-avatar">{{ auth.user?.username?.[0]?.toUpperCase() }}</div>
          <span class="username">{{ auth.user?.username }}</span>
          <button class="btn-logout" @click="handleLogout">Salir</button>
        </div>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useModalStore } from '@/stores/modal'

const router   = useRouter()
const auth     = useAuthStore()
const toast    = useToastStore()
const modal    = useModalStore()

function openAuth(tab) { modal.openAuth(tab) }

function handleLogout() {
  auth.logout()
  toast.show('Sesión cerrada', 'info')
  router.push('/')
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(13,13,15,0.92);
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
  background: linear-gradient(135deg, $gold, $gold2);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #000;
}
.username { font-size: 14px; font-weight: 600; }
.btn-logout {
  padding: 6px 12px; border-radius: 20px;
  background: $bg3; color: $text2;
  font-size: 12px; border: 1px solid $border; transition: $transition;
  &:hover { color: $red; border-color: $red; }
}

@media (max-width: 768px) { .navbar-center { display: none; } }
</style>
