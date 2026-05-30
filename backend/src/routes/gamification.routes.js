const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
//const authMiddleware = require('../middleware/auth.middleware');

//router.use(authMiddleware);

router.get('/ranking', gamificationController.getRanking);

module.exports = router;