// ─── Watchly API Service ─────────────────────────────────────────────────────
const API_URL = 'http://localhost:3001/api';

const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async register(username, email, password) {
    return request('/auth/register', 'POST', { username, email, password });
  },
  async login(email, password) {
    return request('/auth/login', 'POST', { email, password });
  },

  // ── Movies ────────────────────────────────────────────────────────────────
  async search(query, page = 1) {
    return request(`/movies/search?q=${encodeURIComponent(query)}&page=${page}`);
  },
  async popular(page = 1) {
    return request(`/movies/popular?page=${page}`);
  },
  async movieDetail(id) {
    return request(`/movies/${id}`);
  },
  async discover(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/movies/discover?${qs}`);
  },
  async random(genre, rating = 6) {
    let url = `/movies/random?rating=${rating}`;
    if (genre) url += `&genre=${genre}`;
    return request(url);
  },
  async genres() {
    return request('/movies/genres');
  },

  // ── Favorites ─────────────────────────────────────────────────────────────
  async getFavorites() {
    return request('/favorites', 'GET', null, true);
  },
  async addFavorite(movie) {
    return request('/favorites', 'POST', movie, true);
  },
  async removeFavorite(movieId) {
    return request(`/favorites/${movieId}`, 'DELETE', null, true);
  },
  async checkFavorite(movieId) {
    return request(`/favorites/check/${movieId}`, 'GET', null, true);
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  async createGroup() {
    return request('/groups/create', 'POST', {}, true);
  },
  async joinGroup(code) {
    return request('/groups/join', 'POST', { code }, true);
  },
  async getGroup(code) {
    return request(`/groups/${code}`, 'GET', null, true);
  },
  async voteMovie(code, movieId, vote) {
    return request(`/groups/${code}/vote`, 'POST', { movie_id: movieId, vote }, true);
  }
};

async function request(path, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('watchly_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

window.api = api;
