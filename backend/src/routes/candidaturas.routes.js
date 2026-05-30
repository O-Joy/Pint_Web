// candidaturas.routes.js
// Rotas da API para o módulo de candidaturas.
//
// Todas as rotas requerem autenticação JWT (authMiddleware).
// O upload de evidências usa multer para receber ficheiros multipart/form-data.
//
// ADICIONAR NO app.js:
//   const candidaturasRoutes = require('./routes/candidaturas.routes');
//   app.use('/api', candidaturasRoutes);

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');

const authMiddleware         = require('../middleware/auth');
const candidaturasController = require('../controllers/candidaturas.controller');

// ─────────────────────────────────────────────────────────────
// Configuração do multer para upload de evidências
// Os ficheiros são guardados em uploads/evidencias/
// ─────────────────────────────────────────────────────────────
const pastaEvidencias = path.join(__dirname, '../../uploads/evidencias');

// Cria a pasta se não existir (na primeira execução)
if (!fs.existsSync(pastaEvidencias)) {
  fs.mkdirSync(pastaEvidencias, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaEvidencias);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + numCandidatura + requisito + extensão original
    // Exemplo: 1748000000000_cand5_req2.pdf
    const numCandidatura = req.params.numCandidatura || 'x';
    const idRequisito    = req.body.idRequisito || 'x';
    const ext            = path.extname(file.originalname);
    const nome           = `${Date.now()}_cand${numCandidatura}_req${idRequisito}${ext}`;
    cb(null, nome);
  },
});

// Tipos de ficheiro aceites: PDF, ZIP, imagens
const filtroFicheiro = (req, file, cb) => {
  const tiposPermitidos = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de ficheiro não permitido. Aceites: PDF, ZIP, JPEG, PNG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filtroFicheiro,
  limits: { fileSize: 10 * 1024 * 1024 }, // máximo 10 MB
});

// ─────────────────────────────────────────────────────────────
// Middleware de autenticação em todas as rotas
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────────────────────

// GET  /api/candidaturas/estados       → lista todos os estados possíveis
// (deve ficar antes de /candidaturas/:numCandidatura para não ser interceptada)
router.get('/candidaturas/estados', candidaturasController.getEstados);

// GET  /api/candidaturas               → todas as candidaturas do consultor autenticado
router.get('/candidaturas', candidaturasController.getCandidaturas);

// POST /api/candidaturas               → cria uma nova candidatura
router.post('/candidaturas', candidaturasController.criarCandidatura);

// GET  /api/candidaturas/:id/detalhes  → histórico + evidências de uma candidatura
router.get('/candidaturas/:numCandidatura/detalhes', candidaturasController.getDetalhesCandidatura);

// POST /api/candidaturas/:id/evidencias → upload de ficheiro de evidência
// O Flutter envia multipart/form-data com os campos:
//   - ficheiro: File (o ficheiro em si)
//   - idRequisito: int
router.post(
  '/candidaturas/:numCandidatura/evidencias',
  upload.single('ficheiro'),
  candidaturasController.uploadEvidencia,
);

// POST /api/candidaturas/:id/submeter  → submete a candidatura para validação
router.post('/candidaturas/:numCandidatura/submeter', candidaturasController.submeterCandidatura);

module.exports = router;