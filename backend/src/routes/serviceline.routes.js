// serviceline.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware  = require('../middleware/auth');
const verificarPerfil = require('../middleware/perfil');
const sl              = require('../controllers/serviceline.controller');
const gamificationController = require('../controllers/serviceline_gamification');

router.use(authMiddleware);
router.use(verificarPerfil('sl_leader'));

// —— DASHBOARD ——
router.get('/dashboard',           sl.getDashboard);
router.get('/top-consultores',     sl.getTopConsultores);
router.get('/estatisticas-mensais', sl.getEstatisticasMensais);

// —— VALIDAÇÕES ——
router.get('/candidaturas-em-validacao',       sl.getCandidaturasEmValidacao);
router.get('/candidatura/:id/historico',       sl.getHistoricoCandidatura);
router.get('/candidatura/:id/evidencias',      sl.getEvidenciasCandidatura);
router.put('/candidatura/:id/aprovar',         sl.aprovarCandidatura);
router.put('/candidatura/:id/rejeitar',        sl.rejeitarCandidatura);
router.put('/candidatura/:id/devolver',        sl.devolverCandidatura);

// —— BADGES ——
router.get('/badges',              sl.getBadges);
router.get('/badges/:id/requisitos', sl.getRequisitosBadge);

// —— CONSULTORES / RANKING ——
router.get('/consultores',         sl.getConsultores);
router.get('/consultores/:id',     sl.getConsultorDetalhe);
router.get('/ranking',             sl.getRanking);
router.get('/gamification/todos' , gamificationController.getRankingGlobal);

// —— RELATÓRIOS ——
// ── RELATÓRIOS — KPIs ──
router.get('/relatorios/kpis',              sl.getRelatorioKpis);
router.get('/relatorios/evolucao-mensal',   sl.getEvolucaoMensal);
router.get('/relatorios/por-nivel',         sl.getBadgesPorNivel);
router.get('/relatorios/por-area',          sl.getBadgesPorArea);
router.get('/relatorios/sla',               sl.getCumprimentoSLA);
router.get('/relatorios/candidaturas',        sl.relCandidaturas);
router.get('/relatorios/exportar-pedidos',    sl.exportarPedidos);
router.get('/relatorios/exportar-badges',     sl.exportarBadges);
router.get('/relatorios/exportar-consultores', sl.exportarConsultores);
router.get('/relatorios/exportar-aprovacoes', sl.exportarAprovacoes);
router.get('/relatorios/exportar-validacoes', sl.exportarValidacoes);

// —— NOTIFICAÇÕES ——
router.get('/notificacoes',        sl.getNotificacoes);

module.exports = router;