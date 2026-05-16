<template>
  <div id="app">
    <Navbar />
    <main>
      <RouterView />
    </main>
    <MobileNav />
    <MovieModal />
    <AuthModal />
    <ToastContainer />
    <ChatBot />
  </div>
</template>

<script setup>
import Navbar         from '@/components/Navbar.vue'
import MobileNav      from '@/components/MobileNav.vue'
import MovieModal     from '@/components/MovieModal.vue'
import AuthModal      from '@/components/AuthModal.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import ChatBot        from '@/views/Chatbot.vue'
</script>

<style lang="scss">
@use '@/assets/variables' as *;
#app { display: flex; flex-direction: column; min-height: 100vh; }
main { margin-top: 60px; flex: 1; }
@media (max-width: 768px) { main { margin-bottom: 60px; } }
</style>
