<template>
  <Teleport to="body">
    <div v-if="modal.authOpen" class="auth-modal" @click.self="modal.closeAuth()">
      <div class="auth-container">
        <div class="auth-logo">WATCH<span>LY</span></div>

        <div class="auth-tabs">
          <button :class="['auth-tab', { active: modal.authTab === 'login' }]"    @click="modal.authTab = 'login'">Ingresar</button>
          <button :class="['auth-tab', { active: modal.authTab === 'register' }]" @click="modal.authTab = 'register'">Registrarse</button>
        </div>

        <!-- Google Button -->
        <div class="google-btn" @click="handleGoogle">
          <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google"/>
          Continuar con Google
        </div>
        <div class="divider"><span>o</span></div>

        <!-- Login -->
        <form v-if="modal.authTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label>EMAIL</label>
            <input v-model="loginForm.email" type="email" placeholder="tu@email.com" required/>
          </div>
          <div class="form-group">
            <label>CONTRASEÑA</label>
            <input v-model="loginForm.password" type="password" placeholder="••••••••" required/>
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
         <p class="switch-text">
  ¿No tenés cuenta?
  <button type="button" @click="modal.authTab = 'register'">Registrate</button>
</p>
<p class="switch-text">
  <button type="button" @click="modal.authTab = 'forgot'">¿Olvidaste tu contraseña?</button>
</p>
        </form>
       <!-- Forgot Password -->
<form v-if="modal.authTab === 'forgot'" class="auth-form" @submit.prevent="handleForgot">
  <div class="form-group">
    <label>EMAIL</label>
    <input v-model="forgotEmail" type="email" placeholder="tu@email.com" required/>
  </div>
  <button type="submit" class="btn-primary" :disabled="loading">
    {{ loading ? 'Enviando...' : 'Enviar email' }}
  </button>
  <p class="switch-text">
    <button type="button" @click="modal.authTab = 'login'">← Volver</button>
  </p>
</form>
        <!-- Register -->
        <form v-else-if="modal.authTab === 'register'" class="auth-form" @submit.prevent="handleRegister">
          <div class="form-group">
            <label>NOMBRE DE USUARIO</label>
            <input v-model="registerForm.username" type="text" placeholder="cinéfilo123" required minlength="3"/>
          </div>
          <div class="form-group">
            <label>EMAIL</label>
            <input v-model="registerForm.email" type="email" placeholder="tu@email.com" required/>
          </div>
          <div class="form-group">
            <label>CONTRASEÑA</label>
            <input v-model="registerForm.password" type="password" placeholder="mínimo 6 caracteres" required minlength="6"/>
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </button>
          <p class="switch-text">
            ¿Ya tenés cuenta?
            <button type="button" @click="modal.authTab = 'login'">Ingresá</button>
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore }  from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const modal   = useModalStore()
const auth    = useAuthStore()
const toast   = useToastStore()
const loading = ref(false)
const forgotEmail = ref('')
const loginForm    = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })

async function handleLogin() {
  loading.value = true
  try {
    await auth.login(loginForm.value.email, loginForm.value.password)
    modal.closeAuth()
    toast.show(`¡Bienvenido, ${auth.user.username}! 🎬`, 'success')
  } catch (err) { toast.show(err.message, 'error') }
  finally { loading.value = false }
}
async function handleForgot() {
  loading.value = true
  try {
    await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail.value })
    })
    toast.show('Te enviamos un email para resetear tu contraseña 📧', 'success')
    modal.closeAuth()
  } catch (err) {
    toast.show('Error al enviar el email', 'error')
  } finally {
    loading.value = false
  }
}
async function handleRegister() {
  loading.value = true
  try {
    await auth.register(registerForm.value.username, registerForm.value.email, registerForm.value.password)
    modal.closeAuth()
    toast.show(`¡Cuenta creada! Bienvenido ${auth.user.username} 🎉`, 'success')
  } catch (err) { toast.show(err.message, 'error') }
  finally { loading.value = false }
}

// Google OAuth
function handleGoogle() {
  if (window.google) {
    window.google.accounts.id.prompt()
  } else {
    toast.show('Google no está disponible', 'error')
  }
}

onMounted(() => {
  if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          await auth.googleLogin(credential)
          modal.closeAuth()
          toast.show(`¡Bienvenido, ${auth.user.username}! 🎬`, 'success')
        } catch (err) { toast.show(err.message, 'error') }
      }
    })
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.auth-modal {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
}
.auth-container {
  background: $bg2; border: 1px solid $border; border-radius: 16px;
  padding: 40px; width: 100%; max-width: 400px;
}
.auth-logo {
  text-align: center; font-family: $font-display; font-size: 32px;
  letter-spacing: 3px; margin-bottom: 28px;
  span { color: $gold; }
}
.auth-tabs {
  display: flex; background: $bg3; border-radius: $radius-sm;
  padding: 4px; margin-bottom: 20px; gap: 4px;
}
.auth-tab {
  flex: 1; padding: 9px; background: transparent; border: none;
  color: $text2; font-size: 14px; font-weight: 600; border-radius: 6px;
  font-family: $font-body; transition: all $transition; cursor: pointer;
  &.active { background: $bg4; color: $text; }
}
.google-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px; border-radius: $radius-sm;
  border: 1px solid $border; background: $bg3; color: $text;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all $transition; margin-bottom: 16px;
  &:hover { border-color: $gold; }
}
.divider {
  text-align: center; position: relative; margin-bottom: 16px;
  &::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: $border; }
  span { background: $bg2; padding: 0 12px; color: $text3; font-size: 13px; position: relative; }
}
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.form-group {
  display: flex; flex-direction: column; gap: 6px;
  label { font-size: 12px; font-weight: 600; color: $text2; letter-spacing: 0.5px; }
  input {
    padding: 12px 14px; background: $bg3; border: 1px solid $border;
    border-radius: $radius-sm; color: $text; font-size: 14px; font-family: $font-body; outline: none;
    transition: border-color $transition;
    &:focus { border-color: $gold; }
    &::placeholder { color: $text3; }
  }
}
.btn-primary { width: 100%; margin-top: 8px; }
.switch-text {
  text-align: center; font-size: 13px; color: $text3;
  button { background: none; color: $gold; font-size: 13px; font-family: $font-body; cursor: pointer; border: none; }
}
</style>
