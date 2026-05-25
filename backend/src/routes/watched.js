const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWatched, addWatched, removeWatched, checkWatched } = require('../controllers/watchedController');
router.use(auth);
/**
 * @swagger
 * /watched:
 *   get:
 *     summary: Obtener películas vistas por el usuario
 *     tags: [Watched]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de películas vistas
 *   post:
 *     summary: Marcar una película como vista
 *     tags: [Watched]
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
 *         description: Película marcada como vista
 */
router.get('/', getWatched);
router.post('/', addWatched);

/**
 * @swagger
 * /watched/check/{movieId}:
 *   get:
 *     summary: Verificar si una película fue marcada como vista
 *     tags: [Watched]
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
 *         description: Resultado (isWatched true/false)
 */
router.get('/check/:movieId', checkWatched);

/**
 * @swagger
 * /watched/{movieId}:
 *   delete:
 *     summary: Eliminar una película de la lista de vistas
 *     tags: [Watched]
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
 *         description: Eliminado de vistas
 */
router.delete('/:movieId', removeWatched);
module.exports = router;