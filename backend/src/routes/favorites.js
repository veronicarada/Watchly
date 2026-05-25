// favorites.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');
router.use(auth);
/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Obtener favoritos del usuario
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de películas favoritas
 *   post:
 *     summary: Agregar una película a favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movie_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Película agregada a favoritos
 */
router.get('/', getFavorites);
router.post('/', addFavorite);

/**
 * @swagger
 * /favorites/check/{movieId}:
 *   get:
 *     summary: Verificar si una película está en favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resultado (isFavorite true/false)
 */
router.get('/check/:movieId', checkFavorite);

/**
 * @swagger
 * /favorites/{movieId}:
 *   delete:
 *     summary: Eliminar una película de favoritos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminado de favoritos
 */
router.delete('/:movieId', removeFavorite);
module.exports = router;
