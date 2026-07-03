const express = require('express');
const router = express.Router();
const notificacoesController = require('../controllers/notificacoes.controller');
const authMiddleware = require('../middleware/auth');
 
router.use(authMiddleware);
 
// GET    /api/notificacoes      — lista todas as notificações do utilizador
router.get('/notificacoes', notificacoesController.getNotificacoes);
 
// DELETE /api/notificacoes/:id  — elimina uma notificação do utilizador
router.delete('/notificacoes/:id', notificacoesController.eliminarNotificacao);

// PUT ->marcar com lida
router.put('/notificacoes/:id/lida', notificacoesController.marcarLida);

// PUT -> marcar como não lida
router.put('/notificacoes/:id/nao-lida', notificacoesController.marcarNaoLida);

// PUT -> marcar todas como lidas
router.put('/notificacoes/marcar-todas-lidas', notificacoesController.marcarTodasLidas);

module.exports = router;