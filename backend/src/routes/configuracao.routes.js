// routes/configuracao.routes.js
const express = require('express');
const router = express.Router();
const configuracaoController = require('../controllers/configuracao.controller');
const authMiddleware = require('../middleware/auth');
const verificarPerfil = require('../middleware/perfil');

// GET /api/configuracao/:chave — pública, sem autenticação
// (a Política de Privacidade tem de poder ser lida mesmo antes do login)
router.get('/configuracao/:chave', configuracaoController.getConfiguracao);

// PUT /api/configuracao/:chave — só o Administrador pode editar
router.put('/configuracao/:chave', authMiddleware, verificarPerfil('administrador'), configuracaoController.atualizarConfiguracao);

module.exports = router;
