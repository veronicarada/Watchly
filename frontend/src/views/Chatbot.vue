<template>
  <!-- Burbuja flotante -->
  <button class="chat-bubble" @click="isOpen = !isOpen">
    {{ isOpen ? '✕' : '🎬' }}
  </button>


  <Transition name="chat">
    <div v-if="isOpen" class="chat-overlay">
      <div class="chat-container">
        <div class="chat-header">
          <div>
            <h1>🎬 Asistente de cine</h1>
            <p>Preguntame sobre cualquier película o pedime recomendaciones</p>
          </div>
          <button class="btn-clear" @click="clearChat">🗑 Borrar</button>
        </div>

        <div class="chat-messages" ref="messagesEl">
          <div v-for="(msg, i) in messages" :key="i"
               class="message" :class="msg.role">
            <div class="bubble">{{ msg.content }}</div>
          </div>
          <div v-if="loading" class="message assistant">
            <div class="bubble">
              <div class="loading-dots"><span/><span/><span/></div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <input
            v-model="input"
            @keydown.enter="send"
            placeholder="Ej: ¿Quién dirigió Inception?..."
            :disabled="loading"
          />
          <button @click="send" :disabled="loading || !input.trim()">
            Enviar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const isOpen = ref(false)
const INITIAL_MESSAGE = { role: 'assistant', content: '¡Hola! Soy tu asistente de cine 🎬 Podés preguntarme sobre cualquier película — su historia, reparto, director, curiosidades — o pedirme recomendaciones según lo que tengas ganas de ver.' }

const savedMessages = localStorage.getItem('watchly-chat')
const messages = ref(savedMessages ? JSON.parse(savedMessages) : [INITIAL_MESSAGE])
const input = ref('')
const loading = ref(false)
const messagesEl = ref(null)

function clearChat() {
  messages.value = [INITIAL_MESSAGE]
  localStorage.removeItem('watchly-chat')
}

async function send() {
  if (!input.value.trim() || loading.value) return

  const userMsg = input.value.trim()
  messages.value.push({ role: 'user', content: userMsg })
  input.value = ''
  loading.value = true

  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })

  try {
    const response = await fetch('http://localhost:3001/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value.map(m => ({ role: m.role, content: m.content }))
      })
    })

    const data = await response.json()
    const reply = data.reply || 'No pude generar una respuesta.'
    messages.value.push({ role: 'assistant', content: reply })
    localStorage.setItem('watchly-chat', JSON.stringify(messages.value))
  } catch {
    messages.value.push({ role: 'assistant', content: 'Hubo un error. Intentá de nuevo.' })
  }

  loading.value = false
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}
</script>

<style lang="scss" scoped>
@use '@/assets/variables' as *;

.chat-bubble {
  position: fixed; bottom: 28px; right: 28px; z-index: 300;
  width: 60px; height: 60px; border-radius: 50%;
  background: $gold; color: #000;
  font-size: 24px; font-weight: 700;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s;
  &:hover { transform: scale(1.1); }
}

.chat-overlay {
  position: fixed; inset: 0; z-index: 299;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 100px 100px 100px 0;
}

.chat-container {
  width: 420px; height: 600px;
  background: $bg2; border: 1px solid $border;
  border-radius: 16px; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid $border;
  display: flex; justify-content: space-between; align-items: center;
  h1 { font-family: $font-display; font-size: 18px; margin-bottom: 2px; }
  p  { font-size: 11px; color: $text2; }
}

.btn-clear {
  padding: 4px 10px; border-radius: 20px;
  background: transparent; border: 1px solid $border;
  color: $text2; font-size: 11px; cursor: pointer;
  transition: $transition;
  &:hover { border-color: $red; color: $red; }
}

.chat-messages {
  flex: 1; overflow-y: auto;
  padding: 16px; display: flex;
  flex-direction: column; gap: 12px;
}

.message {
  display: flex;
  &.user      { justify-content: flex-end; }
  &.assistant { justify-content: flex-start; }
}

.bubble {
  max-width: 85%; padding: 10px 14px;
  border-radius: 16px; font-size: 13px; line-height: 1.6;
  white-space: pre-wrap;

  .user &      { background: $gold; color: #000; font-weight: 500; border-bottom-right-radius: 4px; }
  .assistant & { background: $bg3; color: $text; border-bottom-left-radius: 4px; }
}

.chat-input {
  padding: 12px 16px;
  border-top: 1px solid $border;
  display: flex; gap: 8px;

  input {
    flex: 1; padding: 8px 14px;
    background: $bg3; border: 1px solid $border;
    border-radius: $radius-sm; color: $text;
    font-family: $font-body; font-size: 13px;
    &:focus { outline: none; border-color: $gold; }
    &:disabled { opacity: 0.5; }
  }

  button {
    padding: 8px 16px;
    background: $gold; color: #000;
    border-radius: $radius-sm;
    font-weight: 700; font-size: 13px;
    transition: $transition;
    &:hover:not(:disabled) { background: $gold2; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

.chat-enter-active, .chat-leave-active { transition: opacity 0.2s, transform 0.2s; }
.chat-enter-from, .chat-leave-to { opacity: 0; transform: translateY(10px); }
</style>