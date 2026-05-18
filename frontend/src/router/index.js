// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home      from '@/views/Home.vue'
import Explore   from '@/views/Explore.vue'
import Random    from '@/views/Random.vue'
import Favorites from '@/views/Favorites.vue'
import Group     from '@/views/Group.vue'
import ResetPassword from '@/views/ResetPasswordView.vue'
import Profile from '@/views/ProfileView.vue'

const routes = [
  { path: '/',          name: 'Home',      component: Home },
  { path: '/explorar',  name: 'Explore',   component: Explore },
  { path: '/sorpresa',  name: 'Random',    component: Random },
  { path: '/favoritas', name: 'Favorites', component: Favorites, meta: { requiresAuth: true } },
  { path: '/grupo',     name: 'Group',     component: Group,     meta: { requiresAuth: true } },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
  { path: '/perfil',    name: 'Profile',   component: Profile,   meta: { requiresAuth: true } },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const token = localStorage.getItem('watchly_token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'Home', query: { login: 'true' } }
  }
})

export default router
