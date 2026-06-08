const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardConsultor.controller');
const authMiddleware = require('../middleware/auth');


router.use(authMiddleware);

// GET /api/dashboard/resumo   → 4 cards de resumo
// GET /api/dashboard/objetivos → objetivos em curso
router.get('/dashboard/resumo', dashboardController.getResumo);
router.get('/dashboard/objetivos', dashboardController.getObjetivos);

module.exports = router;