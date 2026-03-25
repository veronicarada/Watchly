// ─── Constants ────────────────────────────────────────────────────────────────
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const PLACEHOLDER = 'https://via.placeholder.com/200x300/1a1a2e/FFD700?text=🎬';

const PROVIDERS_LOGO = {
  8: { name: 'Netflix', color: '#E50914', logo: 'NF' },
  119: { name: 'Prime Video', color: '#00A8E1', logo: 'PR' },
  337: { name: 'Disney+', color: '#113CCF', logo: 'D+' },
  350: { name: 'Apple TV+', color: '#555', logo: 'AP' },
  384: { name: 'HBO Max', color: '#B535F5', logo: 'HB' },
  283: { name: 'Crunchyroll', color: '#F47521', logo: 'CR' },
};

// ─── State ────────────────────────────────────────────────────────────────────
let currentSection = 'home';
let currentFilters = { genre: '', year: '', rating: '' };
let genres = [];
let favoritesData = [];
let currentGroup = null;
let groupVoteMovie = null;

// ─── Navigation ──────────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${name}"]`)?.classList.add('active');
  currentSection = name;

  if (name === 'favorites') loadFavorites();
  if (name === 'group') initGroupSection();
}

// ─── Toast notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
function movieCard(movie) {
  const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : PLACEHOLDER;
  const year = movie.release_date ? movie.release_date.substring(0, 4) : '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  return `
    <div class="movie-card" onclick="openMovieDetail(${movie.id})">
      <div class="movie-poster">
        <img src="${poster}" alt="${movie.title}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
        <div class="movie-overlay">
          <span class="play-icon">▶</span>
        </div>
        <div class="movie-rating">★ ${rating}</div>
      </div>
      <div class="movie-info">
        <h4 class="movie-title">${movie.title}</h4>
        <span class="movie-year">${year}</span>
      </div>
    </div>`;
}

// ─── Home Section ─────────────────────────────────────────────────────────────
async function loadHome() {
  const grid = document.getElementById('popular-grid');
  grid.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    const data = await api.popular();
    grid.innerHTML = data.results.slice(0, 8).map(movieCard).join('');
  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Error al cargar películas populares</p>';
  }
}

async function handleSearch(e) {
  if (e) e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;

  const resultsSection = document.getElementById('section-results');
  const grid = document.getElementById('results-grid');
  const title = document.getElementById('results-title');

  showSection('results');
  title.textContent = `Resultados: "${query}"`;
  grid.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    const data = await api.search(query);
    if (!data.results.length) {
      grid.innerHTML = '<p class="error-msg">No se encontraron resultados 😕</p>';
      return;
    }
    grid.innerHTML = data.results.map(movieCard).join('');
  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Error en la búsqueda</p>';
  }
}

// ─── Explore / Discover ───────────────────────────────────────────────────────
async function loadGenres() {
  try {
    const data = await api.genres();
    genres = data.genres;
    const select = document.getElementById('filter-genre');
    genres.forEach(g => {
      select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
  } catch (err) { console.error('Genres error'); }
}

async function applyFilters() {
  const grid = document.getElementById('explore-grid');
  const genre = document.getElementById('filter-genre').value;
  const year = document.getElementById('filter-year').value;
  const rating = document.getElementById('filter-rating').value;

  currentFilters = { genre, year, rating };
  showSection('explore');
  grid.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    const params = {};
    if (genre) params.genre = genre;
    if (year) params.year = year;
    if (rating) params.rating = rating;

    const data = await api.discover(params);
    grid.innerHTML = data.results.map(movieCard).join('');
    document.getElementById('results-count').textContent = `${data.total_results?.toLocaleString() || data.results.length} resultados`;
  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Error al filtrar</p>';
  }
}

// ─── Movie Detail Modal ───────────────────────────────────────────────────────
async function openMovieDetail(id) {
  const modal = document.getElementById('movie-modal');
  const content = document.getElementById('modal-content');
  modal.classList.add('active');
  content.innerHTML = '<div class="loading-dots center"><span></span><span></span><span></span></div>';

  try {
    const movie = await api.movieDetail(id);
    const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : PLACEHOLDER;
    const backdrop = movie.backdrop_path ? `${IMG_ORIGINAL}${movie.backdrop_path}` : '';
    const year = movie.release_date ? movie.release_date.substring(0, 4) : '—';
    const runtime = movie.runtime ? `${movie.runtime} min` : '—';

    // Check favorite status
    let isFav = false;
    if (auth.isLoggedIn) {
      try {
        const check = await api.checkFavorite(id);
        isFav = check.isFavorite;
      } catch (e) {}
    }

    // Build providers HTML
    const providers = [...(movie.providers?.flatrate || [])];
    const providerHTML = providers.length
      ? providers.map(p => {
          const info = PROVIDERS_LOGO[p.provider_id];
          if (!info) return `<span class="provider-badge" style="background:#333">${p.provider_name.substring(0,3)}</span>`;
          return `<span class="provider-badge" style="background:${info.color}">${info.logo}</span>`;
        }).join('')
      : '<span class="no-providers">No disponible en streaming actualmente</span>';

    const genreList = movie.genres?.map(g => `<span class="genre-tag">${g.name}</span>`).join('') || '';

    content.innerHTML = `
      ${backdrop ? `<div class="modal-backdrop" style="background-image:url(${backdrop})"></div>` : ''}
      <div class="modal-body">
        <div class="modal-poster">
          <img src="${poster}" alt="${movie.title}" onerror="this.src='${PLACEHOLDER}'">
        </div>
        <div class="modal-details">
          <div class="modal-genres">${genreList}</div>
          <h2 class="modal-title">${movie.title}</h2>
          ${movie.tagline ? `<p class="modal-tagline">"${movie.tagline}"</p>` : ''}
          <div class="modal-meta">
            <span class="rating-badge">★ ${movie.vote_average?.toFixed(1)}</span>
            <span>${year}</span>
            <span>${runtime}</span>
          </div>
          <p class="modal-overview">${movie.overview || 'Sin sinopsis disponible.'}</p>
          <div class="modal-section">
            <h4>DISPONIBLE EN</h4>
            <div class="providers-row">${providerHTML}</div>
          </div>
          <div class="modal-actions">
            <button class="btn-primary ${isFav ? 'btn-fav-active' : ''}" id="fav-btn" onclick="toggleFavorite(${movie.id}, this)" data-movie='${JSON.stringify({
              movie_id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              release_year: parseInt(year) || null,
              vote_average: movie.vote_average,
              overview: movie.overview?.substring(0, 300)
            }).replace(/'/g, "&#39;")}'>
              ${isFav ? '❤️ GUARDADA' : '🤍 GUARDAR'}
            </button>
            ${movie.videos?.results?.[0] ? `<a class="btn-secondary" href="https://youtube.com/watch?v=${movie.videos.results[0].key}" target="_blank">▶ TRAILER</a>` : ''}
          </div>
        </div>
      </div>`;

    // Add to group vote if in group mode
    if (currentGroup && groupVoteMovie === null) {
      groupVoteMovie = movie;
    }
  } catch (err) {
    content.innerHTML = '<p class="error-msg">Error al cargar la película</p>';
  }
}

function closeMovieModal() {
  document.getElementById('movie-modal').classList.remove('active');
}

// ─── Favorites ────────────────────────────────────────────────────────────────
async function toggleFavorite(movieId, btn) {
  if (!auth.isLoggedIn) {
    openAuthModal('login');
    showToast('Iniciá sesión para guardar favoritas', 'info');
    return;
  }

  const movieData = JSON.parse(btn.dataset.movie.replace(/&#39;/g, "'"));
  const isFav = btn.classList.contains('btn-fav-active');

  try {
    if (isFav) {
      await api.removeFavorite(movieId);
      btn.classList.remove('btn-fav-active');
      btn.textContent = '🤍 GUARDAR';
      showToast('Eliminada de favoritas', 'info');
    } else {
      await api.addFavorite(movieData);
      btn.classList.add('btn-fav-active');
      btn.textContent = '❤️ GUARDADA';
      showToast('¡Guardada en favoritas! ❤️', 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadFavorites() {
  if (!auth.isLoggedIn) {
    document.getElementById('favorites-grid').innerHTML =
      '<div class="auth-prompt"><p>Iniciá sesión para ver tus favoritas</p><button class="btn-primary" onclick="openAuthModal(\'login\')">Iniciar sesión</button></div>';
    return;
  }

  const grid = document.getElementById('favorites-grid');
  const count = document.getElementById('fav-count');
  grid.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    favoritesData = await api.getFavorites();
    if (count) count.textContent = `${favoritesData.length} guardadas`;

    if (!favoritesData.length) {
      grid.innerHTML = '<p class="error-msg">Todavía no tenés favoritas guardadas 🎬</p>';
      return;
    }

    grid.innerHTML = favoritesData.map(f => `
      <div class="movie-card" onclick="openMovieDetail(${f.movie_id})">
        <div class="movie-poster">
          <img src="${f.poster_path ? IMG_BASE + f.poster_path : PLACEHOLDER}" alt="${f.title}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
          <div class="movie-overlay"><span class="play-icon">▶</span></div>
          <div class="movie-rating">★ ${f.vote_average || '—'}</div>
          <button class="remove-fav" onclick="event.stopPropagation(); removeFavFromList(${f.movie_id})" title="Eliminar">✕</button>
        </div>
        <div class="movie-info">
          <h4 class="movie-title">${f.title}</h4>
          <span class="movie-year">${f.release_year || '—'}</span>
        </div>
      </div>`).join('');
  } catch (err) {
    grid.innerHTML = '<p class="error-msg">Error al cargar favoritas</p>';
  }
}

async function removeFavFromList(movieId) {
  try {
    await api.removeFavorite(movieId);
    showToast('Eliminada de favoritas', 'info');
    loadFavorites();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Random Movie ─────────────────────────────────────────────────────────────
async function getRandomMovie() {
  const genre = document.getElementById('random-genre')?.value || '';
  const btn = document.getElementById('random-btn');
  btn.disabled = true;
  btn.textContent = '🎲 Buscando...';

  try {
    const movie = await api.random(genre);
    openMovieDetail(movie.id);
  } catch (err) {
    showToast('No se encontró película, intentá de nuevo', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🎲 SORPRENDEME';
  }
}

// ─── Group Mode ──────────────────────────────────────────────────────────────
function initGroupSection() {
  const state = document.getElementById('group-state');
  if (currentGroup) {
    showGroupActive();
  } else {
    state.innerHTML = document.getElementById('group-lobby-tpl').innerHTML;
  }
}

async function createGroupRoom() {
  if (!auth.isLoggedIn) { openAuthModal('login'); return; }
  try {
    const group = await api.createGroup();
    currentGroup = group;
    showGroupActive();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function joinGroupRoom() {
  if (!auth.isLoggedIn) { openAuthModal('login'); return; }
  const code = document.getElementById('group-code-input').value.trim().toUpperCase();
  if (!code) return;
  try {
    const group = await api.joinGroup(code);
    currentGroup = group;
    showGroupActive();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showGroupActive() {
  const state = document.getElementById('group-state');
  const members = currentGroup.members || [];
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A29BFE', '#FD79A8'];

  state.innerHTML = `
    <div class="group-active">
      <div class="group-code-display">
        <p>TU CÓDIGO DE SALA</p>
        <h2 class="room-code">${currentGroup.code}</h2>
        <button class="btn-copy" onclick="navigator.clipboard.writeText('${currentGroup.code}'); showToast('Código copiado 📋', 'success')">Compartilo con tus amigos</button>
      </div>
      <div class="group-members">
        <span class="label">MIEMBROS (${members.length}/5)</span>
        <div class="avatars">
          ${members.slice(0, 5).map((m, i) => `<div class="avatar" style="background:${colors[i % colors.length]}">${String(m).substring(0, 2).toUpperCase()}</div>`).join('')}
          ${members.length < 5 ? '<div class="avatar add-avatar">+</div>' : ''}
        </div>
      </div>
      <div class="group-actions">
        <button class="btn-primary" onclick="pickGroupMovie()">🎬 Elegir película para votar</button>
        <button class="btn-ghost" onclick="leaveGroup()">Salir del grupo</button>
      </div>
      ${groupVoteMovie ? renderGroupVote() : ''}
    </div>`;
}

function renderGroupVote() {
  const m = groupVoteMovie;
  const votes = (currentGroup.votes || {})[m.id] || {};
  const yesVotes = Object.values(votes).filter(v => v === 'yes').length;
  const total = (currentGroup.members || []).length;

  return `
    <div class="group-vote">
      <p class="voting-label">VOTANDO AHORA</p>
      <div class="vote-movie">
        <img src="${m.poster_path ? IMG_BASE + m.poster_path : PLACEHOLDER}" alt="${m.title}">
        <div>
          <h4>${m.title}</h4>
          <div class="vote-bar"><div class="vote-progress" style="width:${total ? (yesVotes/total)*100 : 0}%"></div></div>
          <p>${yesVotes} de ${total} votos</p>
        </div>
      </div>
      <div class="vote-buttons">
        <button class="btn-yes" onclick="castVote('yes')">✓ QUIERO VERLA</button>
        <button class="btn-no" onclick="castVote('no')">✕ PASO</button>
      </div>
    </div>`;
}

async function pickGroupMovie() {
  const movie = await api.random();
  groupVoteMovie = movie;
  showGroupActive();
}

async function castVote(vote) {
  if (!currentGroup || !groupVoteMovie) return;
  try {
    const result = await api.voteMovie(currentGroup.code, groupVoteMovie.id, vote);
    if (result.match) {
      showToast('🎉 ¡MATCH! Todos quieren ver esta película!', 'success');
      openMovieDetail(groupVoteMovie.id);
    } else {
      showToast(vote === 'yes' ? '👍 Votaste que sí!' : '👎 Pasaste esta película', 'info');
    }
    // Refresh group data
    currentGroup = await api.getGroup(currentGroup.code);
    showGroupActive();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function leaveGroup() {
  currentGroup = null;
  groupVoteMovie = null;
  initGroupSection();
  showToast('Saliste del grupo', 'info');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  auth.updateUI();
  loadHome();
  loadGenres();
  showSection('home');

  // Event listeners
  document.getElementById('search-form')?.addEventListener('submit', handleSearch);
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target.id === 'auth-modal') closeAuthModal();
  });
  document.getElementById('movie-modal')?.addEventListener('click', e => {
    if (e.target.id === 'movie-modal') closeMovieModal();
  });

  // Quick search on home
  document.getElementById('home-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      document.getElementById('search-input').value = e.target.value;
      handleSearch();
    }
  });
});

// Expose globals
window.showSection = showSection;
window.showToast = showToast;
window.openMovieDetail = openMovieDetail;
window.closeMovieModal = closeMovieModal;
window.toggleFavorite = toggleFavorite;
window.removeFavFromList = removeFavFromList;
window.getRandomMovie = getRandomMovie;
window.applyFilters = applyFilters;
window.createGroupRoom = createGroupRoom;
window.joinGroupRoom = joinGroupRoom;
window.castVote = castVote;
window.leaveGroup = leaveGroup;
window.pickGroupMovie = pickGroupMovie;
window.handleSearch = handleSearch;
