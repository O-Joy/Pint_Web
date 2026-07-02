const express = require('express');
const router = express.Router();
const objetivosController = require('../controllers/objetivos.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/objetivos/tipos', objetivosController.getTipos);
router.get('/objetivos/em-curso', objetivosController.getObjetivosEmCurso);
router.get('/objetivos/historico', objetivosController.getHistorico);
router.get('/objetivos', objetivosController.getObjetivos);
router.post('/objetivos', objetivosController.criarObjetivo);
router.put('/objetivos/:id', objetivosController.editarObjetivo);
router.delete('/objetivos/:id', objetivosController.removerObjetivo);

module.exports = router;