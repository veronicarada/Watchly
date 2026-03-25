const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createGroup, joinGroup, voteMovie, getGroup } = require('../controllers/groupsController');

router.use(auth);

router.post('/create', createGroup);
router.post('/join', joinGroup);
router.get('/:code', getGroup);
router.post('/:code/vote', voteMovie);

module.exports = router;
