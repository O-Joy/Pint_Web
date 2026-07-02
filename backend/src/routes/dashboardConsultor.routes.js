const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardConsultor.controller');
const authMiddleware = require('../middleware/auth');


router.use(authMiddleware);

router.get('/dashboard/resumo', dashboardController.getResumo);
router.get('/dashboard/objetivos', dashboardController.getObjetivos);
router.get('/dashboard/objetivos-resumo', dashboardController.getObjetivosResumo);
router.get('/dashboard/badges-recomendados', dashboardController.getBadgesRecomendados);

module.exports = router;