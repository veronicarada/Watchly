const axios = require('axios');

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  params: { api_key: process.env.TMDB_API_KEY, language: 'es-AR' }
});

// GET /api/movies/search?q=...
const searchMovies = async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });
  try {
    const [esData, enData] = await Promise.all([
      tmdb.get('/search/movie', { params: { query: q, page, include_adult: false, language: 'es-AR' } }),
      tmdb.get('/search/movie', { params: { query: q, page, include_adult: false, language: 'en-US' } })
    ]);

    const seen = new Set();
    const combined = [...esData.data.results, ...enData.data.results].filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    res.json({ ...esData.data, results: combined });
  } catch (err) {
    console.error('searchMovies:', err.message);
    res.status(500).json({ error: 'Error al buscar películas' });
  }
};

// GET /api/movies/popular
const getPopular = async (req, res) => {
  try {
    const { data } = await tmdb.get('/discover/movie', {
      params: {
        sort_by: 'popularity.desc',
        watch_region: 'AR',
        with_watch_monetization_types: 'flatrate',
        'vote_count.gte': 50,
        include_adult: false,
        page: req.query.page || 1
      }
    });
    res.json(data);
  } catch (err) {
    console.error('getPopular:', err.message);
    res.status(500).json({ error: 'Error al obtener populares' });
  }
};

const getMovieDetail = async (req, res) => {
  try {
    const [detail, providers, credits] = await Promise.all([
      tmdb.get(`/movie/${req.params.id}`),
      tmdb.get(`/movie/${req.params.id}/watch/providers`),
      tmdb.get(`/movie/${req.params.id}/credits`)
    ]);

    const results = providers.data.results || {};
    const arData  = results.AR || {};
    const usData  = results.US || {};

    // Plataformas conocidas en Argentina — solo para filtrar el fallback de US
    const PROVIDERS_AR = new Set([
  8, 9, 119,        // Netflix, Prime
  337, 390,         // Disney+
  350, 2,           // Apple TV+
  1899,             // Max
  283,              // Crunchyroll
  531, 582,         // Paramount+
  167,              // Claro Video
  457,              // VIX
  11, 201,          // MUBI
  300,              // Pluto TV
  467,              // DIRECTV GO
])

    const filterAR = (list = []) =>
      list.filter(p => PROVIDERS_AR.has(p.provider_id));

    // AR: devolvemos todo sin filtrar — TMDb ya sabe qué hay en Argentina
    // US: solo usamos si AR está vacío, y filtramos por servicios conocidos acá
    const flatrate = arData.flatrate?.length
      ? arData.flatrate
      : filterAR(usData.flatrate);

    const rent = arData.rent?.length
      ? arData.rent
      : filterAR(usData.rent);

    const buy = arData.buy?.length
      ? arData.buy
      : filterAR(usData.buy);

    res.json({
      ...detail.data,
      providers: { flatrate, rent, buy },
      cast: credits.data.cast?.slice(0, 8) || []
    });
  } catch (err) {
    console.error('getMovieDetail:', err.message);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
};

// GET /api/movies/discover
const discoverMovies = async (req, res) => {
  const { genre, year, rating, page = 1, sort = 'popularity.desc' } = req.query;

  // ✅ Parámetros base — vote_count.gte evita resultados basura con 3 votos
  const params = {
    page,
    sort_by: sort,
    include_adult: false,
    'vote_count.gte': 50
  };

  if (genre)  params.with_genres           = String(genre);
  if (year)   params.primary_release_year  = year;
  if (rating) params['vote_average.gte']   = rating;

  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    res.json(data);
  } catch (err) {
    console.error('discoverMovies:', err.message);
    res.status(500).json({ error: 'Error al descubrir películas' });
  }
};

// GET /api/movies/random
const getRandomMovie = async (req, res) => {
  const { genre, rating = 6 } = req.query;
  const params = {
    sort_by: 'popularity.desc',
    'vote_average.gte': rating,
    'vote_count.gte': 100,
    include_adult: false,
    page: Math.floor(Math.random() * 10) + 1
  };
  if (genre) params.with_genres = String(genre);
  try {
    const { data } = await tmdb.get('/discover/movie', { params });
    if (!data.results.length) return res.status(404).json({ error: 'No se encontró película' });
    res.json(data.results[Math.floor(Math.random() * data.results.length)]);
  } catch (err) {
    console.error('getRandomMovie:', err.message);
    res.status(500).json({ error: 'Error al obtener película aleatoria' });
  }
};

// GET /api/movies/genres
const getGenres = async (req, res) => {
  try {
    const { data } = await tmdb.get('/genre/movie/list');
    res.json(data);
  } catch (err) {
    console.error('getGenres:', err.message);
    res.status(500).json({ error: 'Error al obtener géneros' });
  }
};

// GET /api/movies/now-playing
const getNowPlaying = async (req, res) => {
  try {
    const { data } = await tmdb.get('/movie/now_playing', {
      params: { page: 1, region: 'AR' }
    });
    res.json(data);
  } catch (err) {
    console.error('getNowPlaying:', err.message);
    res.status(500).json({ error: 'Error al obtener cartelera' });
  }
};

module.exports = {
  searchMovies,
  getPopular,
  getMovieDetail,
  discoverMovies,
  getRandomMovie,
  getGenres,
  getNowPlaying
};