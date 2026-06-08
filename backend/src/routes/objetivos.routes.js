const express = require('express');
const router = express.Router();
const objetivosController = require('../controllers/objetivos.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/objetivos             → todos os objetivos do consultor
// GET /api/objetivos/em-curso    → só os em curso
// GET /api/objetivos/concluidos  → só os concluídos
router.get('/objetivos', objetivosController.getObjetivos);
router.get('/objetivos/em-curso', objetivosController.getObjetivosEmCurso);
router.get('/objetivos/concluidos', objetivosController.getObjetivosConcluidos);

module.exports = router;