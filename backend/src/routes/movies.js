const express = require('express');
const router = express.Router();
const {
  searchMovies, getPopular, getMovieDetail,
  getPersonDetail,   // ← importar
  discoverMovies, getRandomMovie, getGenres, getNowPlaying
} = require('../controllers/moviesController');

router.get('/search',     searchMovies);
router.get('/popular',    getPopular);
router.get('/discover',   discoverMovies);
router.get('/random',     getRandomMovie);
router.get('/genres',     getGenres);
router.get('/now-playing', getNowPlaying);
router.get('/person/:id', getPersonDetail);  // ← agregar ANTES de /:id
router.get('/:id',        getMovieDetail);   // ← este debe ir siempre al final

module.exports = router;