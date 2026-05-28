<template>
  <div class="popout-chat">
    <div class="popout-header">
      <span class="popout-title">💬 Chat del grupo</span>
    </div>
    <div class="popout-messages" ref="messagesEl">
      <div v-if="messages.length === 0" class="popout-empty">
        Nadie habló todavía. ¡Rompé el hielo! 🎬
      </div>
      <div v-for="(msg, i) in messages" :key="i" class="popout-msg"
        :class="{ mine: msg.username === username, system: msg.username === '🎬' }">
        <span class="popout-user">{{ msg.username }}</span>
        <span class="popout-bubble">{{ msg.text }}</span>
      </div>
    </div>
    <div class="popout-input-row">
      <input v-model="input" @keydown.enter="send" placeholder="Escribí algo..." class="popout-input" />
      <button @click="send" class="popout-send">➤</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { io } from 'socket.io-client'

const params = new URLSearchParams(window.location.search)
const code = params.get('code')
const username = params.get('username') || 'Anónimo'

const messages = ref([])
const input = ref('')
const messagesEl = ref(null)
let socket = null

onMounted(() => {
  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
  socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

  function joinRoom() {
    socket.emit('rejoin-room', { code, username })
  }

  // Esperamos el evento 'connect' antes de entrar a la sala
  // Así evitamos el race condition donde el emit se manda antes de que el socket esté listo
  socket.on('connect', () => {
    joinRoom()
  })

  // Si ya estaba conectado cuando llegamos (caso edge), lo hacemos igual
  if (socket.connected) {
    joinRoom()
  }

  // Reconexión automática: si se cae y vuelve, reentrar a la sala
  socket.on('reconnect', () => {
    joinRoom()
  })

  socket.on('message-history', (msgs) => {
    messages.value = msgs
    scrollDown()
  })
  socket.on('new-message', (msg) => {
    messages.value.push(msg)
    scrollDown()
  })
  socket.on('user-joined', ({ username: u }) => {
    messages.value.push({ username: '🎬', text: `${u} se unió` })
    scrollDown()
  })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})

function send() {
  if (!input.value.trim() || !socket) return
  socket.emit('send-message', { code, username, text: input.value.trim() })
  input.value = ''
}

async function scrollDown() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: #0f0f1a;
  color: #dcd8d8;
  font-family: 'DM Sans', sans-serif;
}

.popout-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #0f0f1a;
}

.popout-header {
  padding: 10px 14px;
  background: #16162a;
  border-bottom: 1px solid #1e1e35;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.popout-title {
  font-size: 13px;
  font-weight: 700;
  color: #FFD700;
}

.popout-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #1e1e35 transparent;
}

.popout-empty {
  font-size: 12px;
  color: #555;
  text-align: center;
  margin-top: 40px;
}

.popout-msg {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popout-msg.mine {
  align-items: flex-end;
}

.popout-msg.system {
  align-items: center;
  opacity: 0.45;
}

.popout-msg.system .popout-bubble {
  background: transparent;
  font-size: 11px;
  color: #777;
  padding: 2px 6px;
}

.popout-user {
  font-size: 10px;
  color: #666;
  font-weight: 600;
  padding: 0 4px;
}

.popout-bubble {
  background: #16162a;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 12px;
  color: #dcd8d8;
  max-width: 90%;
  word-break: break-word;
  line-height: 1.5;
}

.popout-msg.mine .popout-bubble {
  background: rgba(255, 215, 0, 0.12);
  color: #FFD700;
}

.popout-input-row {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid #1e1e35;
  flex-shrink: 0;
}

.popout-input {
  flex: 1;
  padding: 7px 14px;
  background: #16162a;
  border: 1px solid #1e1e35;
  border-radius: 20px;
  color: #dcd8d8;
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.2s;
}

.popout-input::placeholder {
  color: #444;
}

.popout-input:focus {
  border-color: #FFD700;
}

.popout-send {
  background: #FFD700;
  color: #000;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.popout-send:hover {
  transform: scale(1.08);
}
</style>