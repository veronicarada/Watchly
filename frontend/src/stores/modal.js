// src/stores/modal.js
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useModalStore = defineStore('modal', {
  state: () => ({
    authOpen: false,
    authTab: 'login',
    movieId: null,
    nowPlayingIds: new Set(),
  }),
  actions: {
    openAuth(tab = 'login') { this.authTab = tab; this.authOpen = true },
    closeAuth() { this.authOpen = false },
    openMovie(id) { this.movieId = id },
    closeMovie() { this.movieId = null },
    async loadNowPlaying() {
      if (this.nowPlayingIds.size > 0) return
      try {
        const data = await api.nowPlaying()
        this.nowPlayingIds = new Set(data.results.map(m => m.id))
      } catch {}
    }
  }
})
