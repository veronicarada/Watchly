// src/stores/auth.js
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('watchly_user') || 'null'),
    token: localStorage.getItem('watchly_token') || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    save(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('watchly_token', token)
      localStorage.setItem('watchly_user', JSON.stringify(user))
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('watchly_token')
      localStorage.removeItem('watchly_user')
    },

    async login(email, password) {
      const { token, user } = await api.login(email, password)
      this.save(token, user)
    },

    async register(username, email, password) {
      const { token, user } = await api.register(username, email, password)
      this.save(token, user)
    },

    async googleLogin(credential) {
      const { token, user } = await api.googleLogin(credential)
      this.save(token, user)
    }
  }
})
