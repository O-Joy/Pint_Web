// serviceline.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware  = require('../middleware/auth');
const verificarPerfil = require('../middleware/perfil');
const sl              = require('../controllers/serviceline.controller');

router.use(authMiddleware);
router.use(verificarPerfil('sl_leader'));

// —— DASHBOARD ——
router.get('/sl/dashboard',           sl.getDashboard);
router.get('/sl/top-consultores',     sl.getTopConsultores);
router.get('/sl/estatisticas-mensais', sl.getEstatisticasMensais);

// —— VALIDAÇÕES ——
router.get('/sl/candidaturas-em-validacao',       sl.getCandidaturasEmValidacao);
router.get('/sl/candidatura/:id/historico',       sl.getHistoricoCandidatura);
router.get('/sl/candidatura/:id/evidencias',      sl.getEvidenciasCandidatura);
router.put('/sl/candidatura/:id/aprovar',         sl.aprovarCandidatura);
router.put('/sl/candidatura/:id/rejeitar',        sl.rejeitarCandidatura);
router.put('/sl/candidatura/:id/devolver',        sl.devolverCandidatura);

// —— BADGES ——
router.get('/sl/badges',              sl.getBadges);
router.get('/sl/badges/:id/requisitos', sl.getRequisitosBadge);

// —— CONSULTORES / RANKING ——
router.get('/sl/consultores',         sl.getConsultores);
router.get('/sl/ranking',             sl.getRanking);

// —— RELATÓRIOS ——
router.get('/sl/relatorios/candidaturas',        sl.relCandidaturas);
router.get('/sl/relatorios/exportar-pedidos',    sl.exportarPedidos);
router.get('/sl/relatorios/exportar-badges',     sl.exportarBadges);
router.get('/sl/relatorios/exportar-consultores', sl.exportarConsultores);
router.get('/sl/relatorios/exportar-aprovacoes', sl.exportarAprovacoes);
router.get('/sl/relatorios/exportar-aprovacoes', sl.exportarAprovacoes);

// —— NOTIFICAÇÕES ——
router.get('/sl/notificacoes',        sl.getNotificacoes);

module.exports = router;