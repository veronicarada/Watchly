<template>
  <nav class="mobile-nav">
    <RouterLink to="/"          class="nav-item"><span>🏠</span><span>Inicio</span></RouterLink>
    <RouterLink to="/explorar"  class="nav-item"><span>🔍</span><span>Explorar</span></RouterLink>
    <RouterLink to="/sorpresa"  class="nav-item"><span>🎲</span><span>Sorpresa</span></RouterLink>
    <RouterLink to="/favoritas" class="nav-item"><span>❤️</span><span>Favoritas</span></RouterLink>
    <RouterLink to="/grupo"     class="nav-item"><span>👥</span><span>Grupo</span></RouterLink>
  </nav>
</template>

<style lang="scss" scoped>
@use '@/assets/variables' as *;
.mobile-nav {
  display: none;
  @media (max-width: 768px) {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: rgba(13,13,15,0.95); backdrop-filter: blur(16px);
    border-top: 1px solid $border; height: 60px;
  }
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; color: $text3; font-size: 10px; font-weight: 600; text-decoration: none;
  transition: color $transition;
  span:first-child { font-size: 20px; }
  &.router-link-active { color: $gold; }
}
</style>
