const express = require('express');
const router = express.Router();
const {
  searchMovies, getPopular, getMovieDetail,
  getPersonDetail,
  getProviders,
  discoverMovies, getRandomMovie, getGenres, getNowPlaying
} = require('../controllers/moviesController');

/**
 * @swagger
 * /movies/search:
 *   get:
 *     summary: Buscar películas por título
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de películas encontradas
 */
router.get('/search', searchMovies);

/**
 * @swagger
 * /movies/popular:
 *   get:
 *     summary: Obtener películas populares
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Lista de películas populares
 */
router.get('/popular', getPopular);

/**
 * @swagger
 * /movies/discover:
 *   get:
 *     summary: Descubrir películas con filtros
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de películas filtradas
 */
router.get('/discover', discoverMovies);

/**
 * @swagger
 * /movies/random:
 *   get:
 *     summary: Obtener una película aleatoria
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Una película aleatoria
 */
router.get('/random', getRandomMovie);

/**
 * @swagger
 * /movies/genres:
 *   get:
 *     summary: Obtener lista de géneros
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Lista de géneros disponibles
 */
router.get('/genres', getGenres);

/**
 * @swagger
 * /movies/now-playing:
 *   get:
 *     summary: Películas en cartelera
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Lista de películas en cines
 */
router.get('/now-playing', getNowPlaying);

/**
 * @swagger
 * /movies/person/{id}:
 *   get:
 *     summary: Detalle de un actor o director
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la persona
 *       404:
 *         description: Persona no encontrada
 */
router.get('/person/:id', getPersonDetail);

/**
 * @swagger
 * /movies/providers:
 *   get:
 *     summary: Obtener plataformas de streaming
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Lista de proveedores disponibles
 */
router.get('/providers', getProviders);

/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Detalle de una película
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos completos de la película
 *       404:
 *         description: Película no encontrada
 */
router.get('/:id', getMovieDetail);

module.exports = router;