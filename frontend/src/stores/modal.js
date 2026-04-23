// src/stores/modal.js
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', {
  state: () => ({
    authOpen: false,
    authTab: 'login',
    movieId: null,
  }),
  actions: {
    openAuth(tab = 'login') { this.authTab = tab; this.authOpen = true },
    closeAuth() { this.authOpen = false },
    openMovie(id) { this.movieId = id },
    closeMovie() { this.movieId = null },
  }
})
