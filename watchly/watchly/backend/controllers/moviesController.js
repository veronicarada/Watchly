const axios = require('axios');

const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const LANG = 'es-AR';

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY, language: LANG }
});

// GET /api/movies/search?q=inception
const searchMovies = async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });

  try {
    const { data } = await tmdb.get('/search/movie', { params: { query: q, page } });
    res.json(data);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Error al buscar películas' });
  }
};

// GET /api/movies/popular
const getPopular = async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const { data } = await tmdb.get('/movie/popular', { params: { page } });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener películas populares' });
  }
};

// GET /api/movies/:id
const getMovieDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [detailRes, providersRes, creditsRes] = await Promise.all([
      tmdb.get(`/movie/${id}`),
      tmdb.get(`/movie/${id}/watch/providers`),
      tmdb.get(`/movie/${id}/credits`)
    ]);

    const providers = providersRes.data.results?.AR || providersRes.data.results?.US || {};

    res.json({
      ...detailRes.data,
      providers: {
        flatrate: providers.flatrate || [],
        rent: providers.rent || [],
        buy: providers.buy || []
      },
      cast: creditsRes.data.cast?.slice(0, 8) || []
    });
  } catch (err) {
    console.error('Detail error:', err.message);
    res.status(500).json({ error: 'Error al obtener detalles de la película' });
  }
};

// GET /api/movies/discover?genre=28&year=2023&rating=7&page=1
const discoverMovies = async (req, res) => {
  const { genre, year, rating, page = 1, sort = 'popularity.desc' } = req.query;
  const params = { page, sort_by: sort };

  if (genre) params.with_genres = genre;
  if (year) params.primary_release_year = year;
  if (rating) params['vote_average.gte'] = rating;

  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al descubrir películas' });
  }
};

// GET /api/movies/random?genre=28
const getRandomMovie = async (req, res) => {
  const { genre, rating = 6 } = req.query;
  const params = {
    sort_by: 'popularity.desc',
    'vote_average.gte': rating,
    'vote_count.gte': 100,
    page: Math.floor(Math.random() * 10) + 1
  };
  if (genre) params.with_genres = genre;

  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    const movies = data.results;
    if (!movies.length) return res.status(404).json({ error: 'No se encontró película' });
    const random = movies[Math.floor(Math.random() * movies.length)];
    res.json(random);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener película aleatoria' });
  }
};

// GET /api/movies/genres
const getGenres = async (req, res) => {
  try {
    const { data } = await tmdb.get('/genre/movie/list');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener géneros' });
  }
};

module.exports = { searchMovies, getPopular, getMovieDetail, discoverMovies, getRandomMovie, getGenres };
