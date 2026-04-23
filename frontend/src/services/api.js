// src/services/api.js
const API_URL = 'http://localhost:3001/api'

async function request(path, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = localStorage.getItem('watchly_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${API_URL}${path}`, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data
}

export const api = {
  // Auth
  register: (username, email, password) => request('/auth/register', 'POST', { username, email, password }),
  login: (email, password) => request('/auth/login', 'POST', { email, password }),
  googleLogin: (credential) => request('/auth/google', 'POST', { credential }),

  // Movies
  search: (q, page = 1) => request(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`),
  popular: (page = 1) => request(`/movies/popular?page=${page}`),
  movieDetail: (id) => request(`/movies/${id}`),
  discover: (params = {}) => request(`/movies/discover?${new URLSearchParams(params)}`),
  random: (genre, rating = 6) => request(`/movies/random?rating=${rating}${genre ? '&genre=' + genre : ''}`),
  nowPlaying: () => request('/movies/now-playing'),
  genres: () => request('/movies/genres'),

  // Favorites
  getFavorites: () => request('/favorites', 'GET', null, true),
  addFavorite: (movie) => request('/favorites', 'POST', movie, true),
  removeFavorite: (movieId) => request(`/favorites/${movieId}`, 'DELETE', null, true),
  checkFavorite: (movieId) => request(`/favorites/check/${movieId}`, 'GET', null, true),

  // Groups
  createGroup: () => request('/groups/create', 'POST', {}, true),
  joinGroup: (code) => request('/groups/join', 'POST', { code }, true),
  getGroup: (code) => request(`/groups/${code}`, 'GET', null, true),
  voteMovie: (code, movie_id, vote) => request(`/groups/${code}/vote`, 'POST', { movie_id, vote }, true),
}
