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
    const [moviesEs, moviesEn, tvEs, tvEn] = await Promise.all([
      tmdb.get('/search/movie', { params: { query: q, page, include_adult: false, language: 'es-AR' } }),
      tmdb.get('/search/movie', { params: { query: q, page, include_adult: false, language: 'en-US' } }),
      tmdb.get('/search/tv',    { params: { query: q, page, include_adult: false, language: 'es-AR' } }),
      tmdb.get('/search/tv',    { params: { query: q, page, include_adult: false, language: 'en-US' } })
    ]);

    const seen = new Set();
    const combined = [
      ...moviesEs.data.results.map(m => ({ ...m, media_type: 'movie' })),
      ...moviesEn.data.results.map(m => ({ ...m, media_type: 'movie' })),
      ...tvEs.data.results.map(m => ({ ...m, media_type: 'tv', title: m.name, release_date: m.first_air_date })),
      ...tvEn.data.results.map(m => ({ ...m, media_type: 'tv', title: m.name, release_date: m.first_air_date }))
    ].filter(m => {
      const key = m.id + '_' + m.media_type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ ...moviesEs.data, results: combined });
  } catch (err) {
    console.error('searchMovies:', err.message);
    res.status(500).json({ error: 'Error al buscar películas' });
  }
};

// GET /api/movies/popular
const getPopular = async (req, res) => {
  try {
    const [movies, tv] = await Promise.all([
      tmdb.get('/discover/movie', {
        params: {
          sort_by: 'popularity.desc',
          watch_region: 'AR',
          with_watch_monetization_types: 'flatrate',
          'vote_count.gte': 50,
          include_adult: false,
          page: req.query.page || 1
        }
      }),
      tmdb.get('/discover/tv', {
        params: {
          sort_by: 'popularity.desc',
          watch_region: 'AR',
          with_watch_monetization_types: 'flatrate',
          'vote_count.gte': 20,
          include_adult: false,
          page: req.query.page || 1
        }
      })
    ]);

    const combined = [
      ...movies.data.results.map(m => ({ ...m, media_type: 'movie' })),
      ...tv.data.results.map(m => ({ ...m, media_type: 'tv', title: m.name, release_date: m.first_air_date }))
    ].sort((a, b) => b.popularity - a.popularity);

    res.json({ ...movies.data, results: combined });
  } catch (err) {
    console.error('getPopular:', err.message);
    res.status(500).json({ error: 'Error al obtener populares' });
  }
};

const getMovieDetail = async (req, res) => {
  const { id } = req.params;
  const { type = 'movie' } = req.query;

  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const [detail, providers, credits] = await Promise.all([
      tmdb.get(`/${endpoint}/${id}`),
      tmdb.get(`/${endpoint}/${id}/watch/providers`),
      tmdb.get(`/${endpoint}/${id}/credits`)
    ]);

    const results = providers.data.results || {};
    const arData  = results.AR || {};
    const usData  = results.US || {};

    const PROVIDERS_AR = new Set([
      8, 9, 119,
      337, 390,
      350, 2,
      1899,
      283,
      531, 582,
      167,
      457,
      11, 201,
      300,
      467,
    ]);

    const filterAR = (list = []) =>
      list.filter(p => PROVIDERS_AR.has(p.provider_id));

    const flatrate = arData.flatrate?.length ? arData.flatrate : filterAR(usData.flatrate);
    const rent     = arData.rent?.length     ? arData.rent     : filterAR(usData.rent);
    const buy      = arData.buy?.length      ? arData.buy      : filterAR(usData.buy);

    const detailData = detail.data;
    if (type === 'tv') {
      detailData.title        = detailData.name;
      detailData.release_date = detailData.first_air_date;
    }

    res.json({
      ...detailData,
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

  const params = {
    page,
    sort_by: sort,
    include_adult: false,
    'vote_count.gte': 50
  };

  if (genre)  params.with_genres          = String(genre);
  if (year)   params.primary_release_year = year;
  if (rating) params['vote_average.gte']  = rating;

  try {
    const tvParams = { ...params, 'vote_count.gte': 20 };
    if (year) { tvParams.first_air_date_year = year; delete tvParams.primary_release_year; }

    const [movies, tv] = await Promise.all([
      tmdb.get('/discover/movie', { params }),
      tmdb.get('/discover/tv',    { params: tvParams })
    ]);

    const combined = [
      ...movies.data.results.map(m => ({ ...m, media_type: 'movie' })),
      ...tv.data.results.map(m => ({ ...m, media_type: 'tv', title: m.name, release_date: m.first_air_date }))
    ].sort((a, b) => b.popularity - a.popularity);

    res.json({ ...movies.data, results: combined });
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
    const [movies, tv] = await Promise.all([
      tmdb.get('/discover/movie', { params }),
      tmdb.get('/discover/tv',    { params: { ...params, 'vote_count.gte': 50 } })
    ]);
    const combined = [
      ...movies.data.results.map(m => ({ ...m, media_type: 'movie' })),
      ...tv.data.results.map(m => ({ ...m, media_type: 'tv', title: m.name, release_date: m.first_air_date }))
    ];
    if (!combined.length) return res.status(404).json({ error: 'No se encontró contenido' });
    res.json(combined[Math.floor(Math.random() * combined.length)]);
  } catch (err) {
    console.error('getRandomMovie:', err.message);
    res.status(500).json({ error: 'Error al obtener contenido aleatorio' });
  }
};

// GET /api/movies/genres
const getGenres = async (req, res) => {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdb.get('/genre/movie/list'),
      tmdb.get('/genre/tv/list')
    ]);
    const seen = new Set();
    const combined = [...movieGenres.data.genres, ...tvGenres.data.genres].filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
    res.json({ genres: combined });
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