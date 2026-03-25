const express = require('express');
const router = express.Router();
const {
  searchMovies,
  getPopular,
  getMovieDetail,
  discoverMovies,
  getRandomMovie,
  getGenres
} = require('../controllers/moviesController');

router.get('/search', searchMovies);
router.get('/popular', getPopular);
router.get('/discover', discoverMovies);
router.get('/random', getRandomMovie);
router.get('/genres', getGenres);
router.get('/:id', getMovieDetail);

module.exports = router;
