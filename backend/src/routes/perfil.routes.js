const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const perfilController = require('../controllers/perfil.controller');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// Configuração do multer — só para a foto de perfil.
// Isolada de tudo o resto, mesmo padrão das evidências.
// ─────────────────────────────────────────────────────────────
const pastaFotos = path.join(__dirname, '../../uploads/fotos');
if (!fs.existsSync(pastaFotos)) {
  fs.mkdirSync(pastaFotos, { recursive: true });
}

const uploadFoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaFotos),
    filename: (req, file, cb) => {
      const idUtilizador = req.user?.idUtilizador || 'x';
      cb(null, `${Date.now()}_utilizador${idUtilizador}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    cb(null, tiposPermitidos.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
});

// Todas as rotas deste ficheiro precisam de token
router.use(authMiddleware);

// GET /api/areas — lista de áreas para o dropdown das Definições
router.get('/areas', perfilController.getAreas);

// GET /api/perfil/me — dados reais e atuais do próprio perfil
router.get('/perfil/me', perfilController.getMeuPerfil);

// PUT /api/perfil/me — editar o próprio perfil (foto, telefone, linkedin, área)
// NOTA: continua exatamente como estava — o URL da foto é só texto aqui
router.put('/perfil/me', perfilController.editarMeuPerfil);

// POST /api/perfil/foto — endpoint ISOLADO para upload da foto (multipart)
router.post('/perfil/foto', uploadFoto.single('foto'), perfilController.uploadFotoPerfil);

// PUT /api/perfil/password — alterar password do consultor autenticado
router.put('/perfil/password', perfilController.alterarPassword);

module.exports = router;