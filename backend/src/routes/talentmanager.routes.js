const express = require('express');
const router = express.Router();
const tmController = require('../controllers/talentmanager.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/tm/dashboard', tmController.getDashboard);
router.get('/tm/candidaturas', tmController.getCandidaturas);
router.get('/tm/consultores', tmController.getConsultores);
router.put('/tm/candidaturas/:numCandidatura/aprovar', tmController.aprovarCandidatura);
router.put('/tm/candidaturas/:numCandidatura/rejeitar', tmController.rejeitarCandidatura);
router.put('/tm/candidaturas/:numCandidatura/devolver', tmController.devolverCandidatura);
router.get('/tm/estatisticas-mensais', tmController.getEstatisticasMensais);
router.get('/tm/historico-badges', tmController.getHistoricoBadges);

router.get('/tm/top-consultores', tmController.getTopConsultores);
module.exports = router;