const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const groupsController = require('../controllers/groupsController');

// Aplicar el middleware de autenticación a todas las rutas de este archivo
router.use(auth);

// Rutas base del grupo
router.post('/create', groupsController.createGroup);
router.post('/join', groupsController.joinGroup);
router.get('/:code', groupsController.getGroup);

// Rutas de votación y flujo dinámico (Modo Tinder / Noche de cine)
router.post('/:code/vote', groupsController.voteMovie);
router.post('/:code/propose', groupsController.proposeMovie);
router.patch('/:code/status', groupsController.updateStatus);

// Ruta para resolver empates de forma aleatoria ("Elegir por mí")
router.post('/:code/tiebreaker', groupsController.resolveTieBreaker);
module.exports = router;