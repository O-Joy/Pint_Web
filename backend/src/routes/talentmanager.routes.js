const express = require('express');
const router = express.Router();
const tmController = require('../controllers/talentmanager.controller');
const authMiddleware = require('../middleware/auth');
const tmGamificationController = require('../controllers/talentmanager_gamification');

router.use(authMiddleware);

router.get('/tm/dashboard', tmController.getDashboard);
router.get('/tm/candidaturas', tmController.getCandidaturas);
router.get('/tm/consultores', tmController.getConsultoresLista);
router.get('/tm/consultores/:id', tmController.getConsultorDetalheTM);

router.put('/tm/candidaturas/:numCandidatura/aprovar', tmController.aprovarCandidatura);
router.put('/tm/candidaturas/:numCandidatura/rejeitar', tmController.rejeitarCandidatura);
router.put('/tm/candidaturas/:numCandidatura/devolver', tmController.devolverCandidatura);
router.get('/tm/candidaturas/:numCandidatura/detalhe', tmController.getCandidaturaDetalhe);

router.get('/tm/estatisticas-mensais', tmController.getEstatisticasMensais);
router.get('/tm/historico-badges', tmController.getHistoricoBadges);


router.put('/tm/evidencias/:idEvidencia/validar', tmController.validarEvidencia);
router.put('/tm/evidencias/:idEvidencia/rejeitar', tmController.rejeitarEvidencia);
router.get('/tm/evidencias/:idEvidencia/download', tmController.downloadEvidencia);

router.get('/tm/relatorios/kpis', tmController.getRelatorioKpis);
router.get('/tm/relatorios/evolucao-mensal', tmController.getEvolucaoMensalRelatorio);
router.get('/tm/relatorios/por-area', tmController.getBadgesPorAreaRelatorio);
router.get('/tm/relatorios/por-nivel', tmController.getBadgesPorNivelRelatorio);
router.get('/tm/relatorios/sla', tmController.getSlaRelatorio);
router.get('/tm/relatorios/exportar-badges', tmController.exportarBadgesRelatorio);
router.get('/tm/relatorios/exportar-pedidos', tmController.exportarPedidosRelatorio);
router.get('/tm/relatorios/exportar-consultores', tmController.exportarConsultoresRelatorio);
router.get('/tm/relatorios/exportar-validacoes', tmController.exportarValidacoesRelatorio);

router.get('/tm/gamification/todos', tmGamificationController.getRankingGlobal);
router.get('/tm/gamification/estatisticas', tmGamificationController.getEstatisticasGamification);

router.get('/tm/top-consultores', tmController.getTopConsultores);
module.exports = router;