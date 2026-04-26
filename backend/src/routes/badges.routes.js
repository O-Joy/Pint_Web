const express = require('express');
const router = express.Router();
const badgesUtilizadorController = require('../controllers/badgesUtilizador.controller');
const badgesCatalogoController = require('../controllers/badgesCatalogo.controller');
const authMiddleware = require('../middleware/auth');

// rota de autenticação
router.use(authMiddleware);

router.get('/badges/todos', badgesUtilizadorController.getTodosBadges);

router.get('/catalogo/todos', badgesCatalogoController.getTodos);

module.exports = router;