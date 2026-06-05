// admin.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware   = require('../middleware/auth');
const verificarPerfil  = require('../middleware/perfil');
const admin            = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(verificarPerfil('administrador'));

// ─── UTILIZADORES ──────────────────────────────────────────────────────────────
router.get   ('/utilizadores',admin.getUtilizadores);
router.get   ('/utilizadores/:id', admin.getUtilizadorById);
router.post  ('/utilizadores', admin.criarUtilizador);
router.put   ('/utilizadores/:id', admin.editarUtilizador);
router.put   ('/utilizadores/:id/ativo', admin.toggleAtivoUtilizador);
router.put   ('/utilizadores/:id/password', admin.redefinirPasswordUtilizador);

// ─── LEARNING PATHS ────────────────────────────────────────────────────────────
router.get   ('/learning-paths', admin.getLearningPaths);
router.post  ('/learning-paths', admin.criarLearningPath);
router.put   ('/learning-paths/:id', admin.editarLearningPath);
router.delete('/learning-paths/:id', admin.eliminarLearningPath);

// ─── SERVICE LINES ─────────────────────────────────────────────────────────────
router.get   ('/service-lines', admin.getServiceLines);
router.post  ('/service-lines', admin.criarServiceLine);
router.put   ('/service-lines/:id', admin.editarServiceLine);
router.delete('/service-lines/:id', admin.eliminarServiceLine);

// ─── ÁREAS ─────────────────────────────────────────────────────────────────────
router.get   ('/areas', admin.getAreas);
router.post  ('/areas', admin.criarArea);
router.put   ('/areas/:id', admin.editarArea);
router.delete('/areas/:id', admin.eliminarArea);

// ─── NÍVEIS ────────────────────────────────────────────────────────────────────
router.get   ('/niveis', admin.getNiveis);
router.post  ('/niveis', admin.criarNivel);
router.put   ('/niveis/:id', admin.editarNivel);
router.delete('/niveis/:id', admin.eliminarNivel);

// ─── BADGES REGULARES ──────────────────────────────────────────────────────────
router.get   ('/badges/regulares', admin.getBadgesRegulares);
router.post  ('/badges/regulares', admin.criarBadgeRegular);
router.put   ('/badges/regulares/:id', admin.editarBadgeRegular);
router.delete('/badges/regulares/:id', admin.eliminarBadgeRegular);

// ─── BADGES ESPECIAIS ──────────────────────────────────────────────────────────
router.get   ('/badges/especiais', admin.getBadgesEspeciais);
router.post  ('/badges/especiais', admin.criarBadgeEspecial);
router.put   ('/badges/especiais/:id', admin.editarBadgeEspecial);
router.delete('/badges/especiais/:id', admin.eliminarBadgeEspecial);

// ─── REQUISITOS ────────────────────────────────────────────────────────────────
router.get   ('/requisitos', admin.getRequisitos);
router.post  ('/requisitos', admin.criarRequisito);
router.put   ('/requisitos/:id', admin.editarRequisito);
router.delete('/requisitos/:id', admin.eliminarRequisito);

// ─── CANDIDATURAS ────────────────────────────────────────────────
router.get   ('/candidaturas', admin.getCandidaturas);
router.get   ('/candidaturas/:numCandidatura', admin.getDetalhesCandidatura);

// ─── AVISOS / INFORMAÇÕES GLOBAIS ──────────────────────────────────────────────
router.get   ('/notificacoes/avisos', admin.getAvisos);
router.post  ('/notificacoes/avisos', admin.criarAviso);
router.delete('/notificacoes/avisos/:id', admin.eliminarAviso);

// ─── REPORTING / KPIs ──────────────────────────────────────────────────────────
router.get   ('/reporting', admin.getReporting);

// ─── EXPORTAÇÃO ───────────────────
router.get   ('/exportar/utilizadores', admin.exportarUtilizadores);
router.get   ('/exportar/badges', admin.exportarBadges);
router.get   ('/exportar/candidaturas', admin.exportarCandidaturas);

module.exports = router;