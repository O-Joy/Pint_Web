const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

// Rotas PÚBLICAS — sem token
router.post('/login', authController.login);
router.post('/recuperar-password', authController.recuperarPassword);
router.post('/verificar-codigo', authController.verificarCodigo);
router.put('/redefinir-password', authController.redefinirPassword);

// Rota PROTEGIDA — precisa de token (primeiro login)
router.put('/configuracao-inicial', authMiddleware, authController.configuracaoInicial);

module.exports = router;