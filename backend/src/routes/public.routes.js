// routes/public.routes.js
// Rotas PÚBLICAS — sem autenticação. Não aplicar authMiddleware aqui.
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/public/destaques', publicController.getDestaques);
router.get('/public/recentes', publicController.getRecentes);
router.get('/public/badges', publicController.getCatalogo);
router.get('/public/consultores', publicController.getDiretorio);
router.get('/public/badges/verify/:token', publicController.verificarBadge);

module.exports = router;
