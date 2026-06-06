const express = require('express');
const router = express.Router();
const kiosquitoController = require('../controllers/kiosquitoController');

// Definimos la ruta GET pública (para que cualquier usuario vea los snacks)
router.get('/promos', kiosquitoController.getPromos);

module.exports = router;