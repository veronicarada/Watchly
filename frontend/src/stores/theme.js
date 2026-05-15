import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 'dark' | 'light' | 'auto'
  const mode = ref(localStorage.getItem('watchly-theme') || 'auto')

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

  const isDark = computed(() => {
  if (mode.value === 'auto') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return mode.value === 'dark'
  })

  function applyTheme() {
    document.documentElement.setAttribute(
      'data-theme',
      isDark.value ? 'dark' : 'light'
    )
  }

  function setMode(newMode) {
    mode.value = newMode
    localStorage.setItem('watchly-theme', newMode)
    applyTheme()
  }

  // Escuchar cambios del sistema cuando está en 'auto'
  systemDark.addEventListener('change', () => {
    if (mode.value === 'auto') applyTheme()
  })

  // Aplicar al cargar
  applyTheme()

  return { mode, isDark, setMode }
})