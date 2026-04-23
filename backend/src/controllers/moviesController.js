const axios = require('axios');

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  params: { api_key: process.env.TMDB_API_KEY, language: 'es-AR' }
});

const searchMovies = async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });
  try {
    const { data } = await tmdb.get('/search/movie', { params: { query: q, page } });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al buscar películas' }); }
};

const getPopular = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/popular', { params: { page: req.query.page || 1 } });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener populares' }); }
};

const getMovieDetail = async (req, res) => {
  try {
    const [detail, providers, credits] = await Promise.all([
      tmdb.get(`/movie/${req.params.id}`),
      tmdb.get(`/movie/${req.params.id}/watch/providers`),
      tmdb.get(`/movie/${req.params.id}/credits`)
    ]);
    const prov = providers.data.results?.AR || providers.data.results?.US || {};
    res.json({
      ...detail.data,
      providers: { flatrate: prov.flatrate || [], rent: prov.rent || [], buy: prov.buy || [] },
      cast: credits.data.cast?.slice(0, 8) || []
    });
  } catch { res.status(500).json({ error: 'Error al obtener detalle' }); }
};

const discoverMovies = async (req, res) => {
  const { genre, year, rating, page = 1, sort = 'popularity.desc' } = req.query;
  const params = { page, sort_by: sort };
  if (genre) params.with_genres = genre;
  if (year) params.primary_release_year = year;
  if (rating) params['vote_average.gte'] = rating;
  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al descubrir películas' }); }
};

const getRandomMovie = async (req, res) => {
  const { genre, rating = 6 } = req.query;
  const params = { sort_by: 'popularity.desc', 'vote_average.gte': rating, 'vote_count.gte': 100, page: Math.floor(Math.random() * 10) + 1 };
  if (genre) params.with_genres = genre;
  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    const movies = data.results;
    if (!movies.length) return res.status(404).json({ error: 'No se encontró película' });
    res.json(movies[Math.floor(Math.random() * movies.length)]);
  } catch { res.status(500).json({ error: 'Error al obtener película aleatoria' }); }
};

const getGenres = async (req, res) => {
  try {
    const { data } = await tmdb.get('/genre/movie/list');
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener géneros' }); }
};
const getNowPlaying = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/now_playing', { params: { page: 1 } });
    res.json(data);
  } catch { res.status(500).json({ error: 'Error al obtener cartelera' }); }
};
module.exports = { searchMovies, getPopular, getMovieDetail, discoverMovies, getRandomMovie, getGenres, getNowPlaying };
