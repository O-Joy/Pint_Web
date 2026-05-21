const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const authMiddleware = require('../middleware/auth');

// Todas as rotas deste ficheiro precisam de token
router.use(authMiddleware);

// GET /api/areas — lista de áreas para o dropdown das Definições
router.get('/areas', perfilController.getAreas);

// PUT /api/perfil/password — alterar password do consultor autenticado
router.put('/perfil/password', perfilController.alterarPassword);

module.exports = router;