<template>
  <div class="kiosco-wrapper">
    <button class="kiosco-bubble" @click="isOpen = !isOpen">
      🏪
      <span class="kiosco-label">Kiosco</span>
    </button>

    <Transition name="kiosco">
      <div v-if="isOpen" class="kiosco-overlay" @click.self="isOpen = false">
        <div class="kiosco-container">
          <div class="kiosco-header">
            <h3>🏪 Kiosquito</h3>
            <button @click="isOpen = false">✕</button>
          </div>
          <p class="kiosco-sub">¿Sabés qué falta para la noche? Algo rico para acompañar. Pedí ahora y te llega antes de que empiece. 🍿</p>
          <div class="kiosco-delivery-btns">
            <a class="kiosco-btn pedidoya" href="https://www.pedidosya.com.ar/" target="_blank" @click="isOpen = false">PedidosYa</a>
            <a class="kiosco-btn rappi" href="https://www.rappi.com.ar/tiendas/tipo/express-group" target="_blank" @click="isOpen = false"><em>Rappi</em></a>
            <a class="kiosco-btn ubereats" href="https://www.ubereats.com/ar" target="_blank" @click="isOpen = false">Uber Eats</a>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const isOpen = ref(false)
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.kiosco-wrapper { position: fixed; bottom: 100px; right: 28px; z-index: 300; }

.kiosco-bubble {
  width: 60px; height: 60px; border-radius: 50%;
  background: $gold; color: #000; font-size: 24px;
  border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  transition: transform 0.2s; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
  &:hover { transform: scale(1.1); }
}

.kiosco-label {
  font-size: 9px; font-weight: 700; color: #000;
  letter-spacing: 0.5px; line-height: 1;
}

.kiosco-overlay {
  position: fixed; inset: 0; z-index: 299;
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 0 28px 170px;
}

.kiosco-container {
  background: $bg2; border: 1px solid $border;
  border-radius: 16px; padding: 24px; width: 300px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.kiosco-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
  h3 { font-size: 16px; font-weight: 700; color: $gold; }
  button { background: none; border: none; color: $text3; cursor: pointer; font-size: 13px; &:hover { color: $text; } }
}

.kiosco-sub {
  font-size: 13px; color: $text2; margin-bottom: 16px; line-height: 1.6;
}

.kiosco-delivery-btns {
  display: flex; flex-direction: column; gap: 8px;
}

.kiosco-btn {
  padding: 12px; border-radius: 10px;
  font-size: 14px; font-weight: 700;
  text-decoration: none; cursor: pointer;
  text-align: center; display: block;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &.pedidoya { background: #E52243; color: white; font-family: 'Arial Rounded MT Bold', Arial, sans-serif; }
  &.rappi { background: #FF6B00; color: white; font-family: 'Georgia', serif; }
  &.ubereats { background: #1a7a45; color: white; font-weight: 500; }
}

.kiosco-enter-active, .kiosco-leave-active { transition: opacity 0.2s, transform 0.2s; }
.kiosco-enter-from, .kiosco-leave-to { opacity: 0; transform: translateY(10px); }
</style>