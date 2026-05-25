const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const groupsController = require('../controllers/groupsController');

// Aplicar el middleware de autenticación a todas las rutas de este archivo
router.use(auth);

// Rutas base del grupo
/**
 * @swagger
 * /groups/create:
 *   post:
 *     summary: Crear una sala de grupo
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sala creada, devuelve el código único
 */
router.post('/create', groupsController.createGroup);
/**
 * @swagger
 * /groups/join:
 *   post:
 *     summary: Unirse a una sala con un código
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unido a la sala exitosamente
 *       404:
 *         description: Sala no encontrada
 */
router.post('/join', groupsController.joinGroup);
/**
 * @swagger
 * /groups/{code}:
 *   get:
 *     summary: Obtener información de una sala
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la sala
 *       404:
 *         description: Sala no encontrada
 */
router.get('/:code', groupsController.getGroup);

// Rutas de votación y flujo dinámico (Modo Tinder / Noche de cine)
/**
 * @swagger
 * /groups/{code}/vote:
 *   post:
 *     summary: Votar por una película en la sala
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movie_id:
 *                 type: integer
 *               vote:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Voto registrado
 */
router.post('/:code/vote', groupsController.voteMovie);
/**
 * @swagger
 * /groups/{code}/propose:
 *   post:
 *     summary: Proponer una película para la sala
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: Película propuesta
 */
router.post('/:code/propose', groupsController.proposeMovie);
/**
 * @swagger
 * /groups/{code}/status:
 *   post:
 *     summary: Actualizar el estado de la sala
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.post('/:code/status', groupsController.updateStatus);

// Ruta para resolver empates de forma aleatoria ("Elegir por mí")
/**
 * @swagger
 * /groups/{code}/tiebreaker:
 *   post:
 *     summary: Elegir película aleatoriamente para desempatar
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Película ganadora elegida
 */
router.post('/:code/tiebreaker', groupsController.resolveTieBreaker);
module.exports = router;