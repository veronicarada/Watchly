// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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
  updateProfile: (username) => request('/auth/profile', 'PUT', { username }, true),

  // Movies
  search: (q, page = 1) => request(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`),
  searchTV: (q, page = 1) => request(`/movies/search-tv?q=${encodeURIComponent(q)}&page=${page}`),
  popular: (page = 1) => request(`/movies/popular?page=${page}`),
  movieDetail: (id, type = 'movie') => {
   const cleanId = String(id).replace('_tv', '').replace('_movie', '')
   const resolvedType = String(id).includes('_tv') ? 'tv' : type
   return request(`/movies/${cleanId}?type=${resolvedType}`)
  },
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

  //Noche de cine
  proposeMovie: (code, movie_id, title, poster_path) => request(`/groups/${code}/propose`, 'POST', { movie_id, title, poster_path }, true),
  updateStatus: (code, status) => request(`/groups/${code}/status`, 'POST', { status }, true),
  resolveTieBreaker: (code) => request(`/groups/${code}/tiebreaker`, 'POST', {}, true),

  // Reseñas
  getReviews: (movieId) => request(`/reviews/${movieId}`, 'GET', null, true),
  createReview: (reviewData) => request('/reviews', 'POST', reviewData, true),
  updateReview: (reviewId, reviewData) => request(`/reviews/${reviewId}`, 'PUT', reviewData, true),
  deleteReview: (reviewId) => request(`/reviews/${reviewId}`, 'DELETE', null, true),
  reactToReview: (reviewId, type) => request(`/reviews/${reviewId}/react`, 'POST', { type }, true),
}
