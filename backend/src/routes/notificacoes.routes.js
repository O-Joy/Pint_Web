const express = require('express');
const router = express.Router();
const notificacoesController = require('../controllers/notificacoes.controller');
const authMiddleware = require('../middleware/auth');
 
router.use(authMiddleware);
 
// GET    /api/notificacoes      — lista todas as notificações do utilizador
router.get('/notificacoes', notificacoesController.getNotificacoes);
 
// DELETE /api/notificacoes/:id  — elimina uma notificação do utilizador
router.delete('/notificacoes/:id', notificacoesController.eliminarNotificacao);
 
module.exports = router;