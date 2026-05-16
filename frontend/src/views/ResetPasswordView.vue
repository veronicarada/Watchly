<template>
  <div class="reset-container">
    <div class="reset-box">
      <div class="auth-logo">WATCH<span>LY</span></div>

      <div v-if="!success">
        <h2>Nueva contraseña</h2>
        <p class="subtitle">Ingresá tu nueva contraseña</p>

        <form class="auth-form" @submit.prevent="handleReset">
          <div class="form-group">
            <label>NUEVA CONTRASEÑA</label>
            <input v-model="password" type="password" placeholder="mínimo 6 caracteres" required minlength="6"/>
          </div>
          <div class="form-group">
            <label>CONFIRMÁ LA CONTRASEÑA</label>
            <input v-model="confirm" type="password" placeholder="repetí la contraseña" required minlength="6"/>
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </form>
      </div>

      <div v-else class="success-msg">
        <p>✅ ¡Contraseña actualizada correctamente!</p>
        <router-link to="/" class="btn-primary">Ir al inicio</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function handleReset() {
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: route.query.token, password: password.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    success.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.reset-container {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: $bg;
}
.reset-box {
  background: $bg2; border: 1px solid $border; border-radius: 16px;
  padding: 40px; width: 100%; max-width: 400px;
}
.auth-logo {
  text-align: center; font-family: $font-display; font-size: 32px;
  letter-spacing: 3px; margin-bottom: 28px;
  span { color: $gold; }
}
h2 { text-align: center; margin-bottom: 8px; }
.subtitle { text-align: center; color: $text3; font-size: 14px; margin-bottom: 20px; }
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
.btn-primary { width: 100%; margin-top: 8px; display: block; text-align: center; }
.error-msg { color: #e74c3c; font-size: 13px; text-align: center; }
.success-msg { text-align: center; display: flex; flex-direction: column; gap: 16px; }
</style>