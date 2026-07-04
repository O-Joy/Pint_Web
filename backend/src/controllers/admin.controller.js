// admin.controller.js
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const Utilizador = require('../model/utilizador');
const Administrador = require('../model/administrador');
const TalentManager = require('../model/talentManager');
const SlLeader = require('../model/slleader');
const Consultor = require('../model/consultor');
const LearningPath = require('../model/learningPath');
const ServiceLine = require('../model/serviceLine');
const Area = require('../model/area');
const Nivel = require('../model/nivel');
const Requisitos = require('../model/requisitos');
const BadgeRegular = require('../model/badgeRegular');
const BadgeEspecial = require('../model/badgeEspecial');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Candidatura= require('../model/candidatura');
const HistoricoCandidatura = require('../model/historicoCandidatura');
const EstadosCandidatura  = require('../model/estadosCandidatura');
const Notificacao = require('../model/notificacao');
const UtilizadorNotificacao = require('../model/utilizadorNotificacao');
const Pontuacao = require('../model/pontuacao');


// ─────────────────────────────────────────────────────────────
// devolve o perfil de um utilizador (consultor/tm/sll/admin)
// ─────────────────────────────────────────────────────────────
async function getPerfil(idUtilizador) {
  if (await Administrador.findOne({ where: { idUtilizador } })) return 'administrador';
  if (await TalentManager.findOne({ where: { idUtilizador } })) return 'talent_manager';
  if (await SlLeader.findOne({ where: { idUtilizador } })) return 'sl_leader';
  if (await Consultor.findOne({ where: { idUtilizador } })) return 'consultor';
  return 'sem_perfil';
}


// ═══════════════════════════════════════════════════════════════
// 1. GESTÃO DE UTILIZADORES
// ═══════════════════════════════════════════════════════════════
// Lista todos os utilizadores com o seu perfil
exports.getUtilizadores = async (req, res) => {
  try {
    const utilizadores = await Utilizador.findAll({
      order: [['nomeUtilizador', 'ASC']],
    })

    const resultado = await Promise.all(utilizadores.map(async (u) => {
      const perfil = await getPerfil(u.idUtilizador)
      
      // Vai buscar idArea e idServiceLine consoante o perfil
      let idArea = null
      let idServiceLine = null

      if (perfil === 'consultor') {
        const c = await Consultor.findOne({ where: { idUtilizador: u.idUtilizador } })
        idArea = c?.idArea || null
      } else if (perfil === 'talent_manager') {
        const tm = await TalentManager.findOne({ where: { idUtilizador: u.idUtilizador } })
        idArea = tm?.idArea || null
        idServiceLine = tm?.idServiceLine || null
      } else if (perfil === 'sl_leader') {
        const sll = await SlLeader.findOne({ where: { idUtilizador: u.idUtilizador } })
        idServiceLine = sll?.idServiceLine || null
      }

      return {
        id: u.idUtilizador,
        nome: u.nomeUtilizador,
        email: u.email,
        telefone: u.telefone,
        ativo: u.ativo === 1,
        dataCriacao: u.dataCriacao,
        ultimoLogin: u.ultimoLogin,
        urlFoto: u.urlFoto,
        perfil,
        idArea,
        idServiceLine,
      }
    }))

    return res.json(resultado)
  } catch (err) {
    console.error('[admin] getUtilizadores:', err.message)
    return res.status(500).json({ error: 'Erro ao listar utilizadores.' })
  }
}

// Detalhes de um utilizador específico
exports.getUtilizadorById = async (req, res) => {
  const idUtilizador = parseInt(req.params.id);

  try {
    const u = await Utilizador.findOne({ where: { idUtilizador } });
    if (!u) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    const perfil = await getPerfil(idUtilizador);

    // Dados extra do perfil (área, service line, etc.)
    let dadosPerfil = {};
    if (perfil === 'consultor') {
      const c = await Consultor.findOne({ where: { idUtilizador } });
      dadosPerfil = { idArea: c?.idArea, idLearningPath: c?.idLearningPath };
    } else if (perfil === 'sl_leader') {
      const sll = await SlLeader.findOne({ where: { idUtilizador } });
      dadosPerfil = { idServiceLine: sll?.idServiceLine };
    } else if (perfil === 'talent_manager') {
      const tm = await TalentManager.findOne({ where: { idUtilizador } });
      dadosPerfil = { idArea: tm?.idArea, idServiceLine: tm?.idServiceLine };
    }

    return res.json({
      id: u.idUtilizador,
      nome: u.nomeUtilizador,
      email: u.email,
      telefone: u.telefone,
      urlLinkedin: u.urlLinkedin,
      urlFoto: u.urlFoto,
      linguaPadrao: u.linguaPadrao,
      ativo: u.ativo === 1,
      dataCriacao: u.dataCriacao,
      ultimoLogin: u.ultimoLogin,
      perfil,
      ...dadosPerfil,
    });
  } catch (err) {
    console.error('[admin] getUtilizadorById:', err.message);
    return res.status(500).json({ error: 'Erro ao obter utilizador.' });
  }
};

// Cria um novo utilizador e associa-o ao perfil indicado
exports.criarUtilizador = async (req, res) => {
  const { nome, email, password, perfil, idArea, idServiceLine, idLearningPath } = req.body;

  if (!nome || !email || !password || !perfil) {
    return res.status(400).json({ error: 'nome, email, password e perfil são obrigatórios.' });
  }

  const perfisValidos = ['consultor', 'talent_manager', 'sl_leader', 'administrador'];
  if (!perfisValidos.includes(perfil)) {
    return res.status(400).json({ error: `Perfil inválido. Valores aceites: ${perfisValidos.join(', ')}` });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A password deve ter pelo menos 6 caracteres.' });
  }

  try {
    // Verifica email duplicado
    const existente = await Utilizador.findOne({ where: { email } });
    if (existente) return res.status(409).json({ error: 'Email já registado.' });

    const hash = await bcrypt.hash(password, 10);

    const novoUtilizador = await Utilizador.create({
      nomeUtilizador: nome,
      email,
      passwordAsh: hash,
      dataCriacao: new Date(),
      ativo: 1,
    });

    const id = novoUtilizador.idUtilizador;

    // Cria o registo na tabela de perfil correspondente
    if (perfil === 'consultor') {
      await Consultor.create({ idUtilizador: id, idArea: idArea || null, idLearningPath: idLearningPath || null });
    } else if (perfil === 'talent_manager') {
      await TalentManager.create({ idUtilizador: id, idArea: idArea || null, idServiceLine: idServiceLine || null });
    } else if (perfil === 'sl_leader') {
      await SlLeader.create({ idUtilizador: id, idServiceLine: idServiceLine || null });
    } else if (perfil === 'administrador') {
      await Administrador.create({ idUtilizador: id });
    }

    return res.status(201).json({ message: 'Utilizador criado com sucesso.', id });
  } catch (err) {
    console.error('[admin] criarUtilizador:', err.message);
    return res.status(500).json({ error: 'Erro ao criar utilizador.' });
  }
};

// Edita dados de um utilizador (nome, email, telefone, ativo, linkedin, lingua)
exports.editarUtilizador = async (req, res) => {
  const idUtilizador = parseInt(req.params.id);
  const { nome, email, telefone, urlLinkedin, linguaPadrao, ativo } = req.body;

  try {
    const u = await Utilizador.findOne({ where: { idUtilizador } });
    if (!u) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    // Verifica se o novo email já existe noutro utilizador
    if (email && email !== u.email) {
      const duplicado = await Utilizador.findOne({ where: { email } });
      if (duplicado) return res.status(409).json({ error: 'Email já em uso.' });
    }

    await u.update({
      nomeUtilizador: nome ?? u.nomeUtilizador,
      email: email ?? u.email,
      telefone: telefone ?? u.telefone,
      urlLinkedin: urlLinkedin ?? u.urlLinkedin,
      linguaPadrao: linguaPadrao ?? u.linguaPadrao,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : u.ativo,
    });

    return res.json({ message: 'Utilizador atualizado.' });
  } catch (err) {
    console.error('[admin] editarUtilizador:', err.message);
    return res.status(500).json({ error: 'Erro ao editar utilizador.' });
  }
};

// Ativa ou desativa (soft delete) um utilizador
exports.toggleAtivoUtilizador = async (req, res) => {
  const idUtilizador = parseInt(req.params.id);
  const { ativo } = req.body;

  if (ativo === undefined) {
    return res.status(400).json({ error: 'Campo "ativo" é obrigatório.' });
  }

  try {
    const u = await Utilizador.findOne({ where: { idUtilizador } });
    if (!u) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    // Impede que o admin desative a sua própria conta
    if (u.idUtilizador === req.user.idUtilizador && !ativo) {
      return res.status(400).json({ error: 'Não podes desativar a tua própria conta.' });
    }

    await u.update({ ativo: ativo ? 1 : 0 });

    return res.json({ message: `Utilizador ${ativo ? 'ativado' : 'desativado'} com sucesso.` });
  } catch (err) {
    console.error('[admin] toggleAtivoUtilizador:', err.message);
    return res.status(500).json({ error: 'Erro ao alterar estado do utilizador.' });
  }
};

// Redefine a password de um utilizador
exports.redefinirPasswordUtilizador = async (req, res) => {
  const idUtilizador = parseInt(req.params.id);
  const { novaPassword } = req.body;

  if (!novaPassword || novaPassword.length < 6) {
    return res.status(400).json({ error: 'A password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const u = await Utilizador.findOne({ where: { idUtilizador } });
    if (!u) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    const hash = await bcrypt.hash(novaPassword, 10);
    await u.update({ passwordAsh: hash });

    return res.json({ message: 'Password redefinida com sucesso.' });
  } catch (err) {
    console.error('[admin] redefinirPasswordUtilizador:', err.message);
    return res.status(500).json({ error: 'Erro ao redefinir password.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 2. GESTÃO DE LEARNING PATHS
// ═══════════════════════════════════════════════════════════════
exports.getLearningPaths = async (req, res) => {
  try {
    const lps = await LearningPath.findAll({ order: [['nomeLp', 'ASC']] });
    return res.json(lps.map(lp => ({
      id: lp.idLearningPath,
      nome: lp.nomeLp,
      descricao: lp.descricao,
      ativo: lp.ativo === 1,
    })));
  } catch (err) {
    console.error('[admin] getLearningPaths:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Learning Paths.' });
  }
};

exports.criarLearningPath = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

  try {
    const lp = await LearningPath.create({
      nomeLp: nome,
      descricao: descricao || null,
      ativo: 1,
    });
    return res.status(201).json({ message: 'Learning Path criado.', id: lp.idLearningPath });
  } catch (err) {
    console.error('[admin] criarLearningPath:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Learning Path.' });
  }
};

exports.editarLearningPath = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, ativo } = req.body;

  try {
    const lp = await LearningPath.findOne({ where: { idLearningPath: id } });
    if (!lp) return res.status(404).json({ error: 'Learning Path não encontrado.' });

    await lp.update({
      nomeLp: nome ?? lp.nomeLp,
      descricao: descricao ?? lp.descricao,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : lp.ativo,
    });

    return res.json({ message: 'Learning Path atualizado.' });
  } catch (err) {
    console.error('[admin] editarLearningPath:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Learning Path.' });
  }
};

// Só elimina se não tiver ServiceLines associadas
exports.eliminarLearningPath = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temFilhos = await ServiceLine.findOne({ where: { idLearningPath: id } });
    if (temFilhos) {
      return res.status(409).json({ error: 'Não é possível eliminar: existem Service Lines associadas.' });
    }

    const eliminado = await LearningPath.destroy({ where: { idLearningPath: id } });
    if (!eliminado) return res.status(404).json({ error: 'Learning Path não encontrado.' });

    return res.json({ message: 'Learning Path eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarLearningPath:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Learning Path.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 3. GESTÃO DE SERVICE LINES
// ═══════════════════════════════════════════════════════════════
exports.getServiceLines = async (req, res) => {
  try {
    const sls = await ServiceLine.findAll({ order: [['nomeSl', 'ASC']] });
    return res.json(sls.map(sl => ({
      id: sl.idServiceLine,
      nome: sl.nomeSl,
      descricao: sl.descricao,
      ativo: sl.ativo === 1,
      idLearningPath: sl.idLearningPath,
    })));
  } catch (err) {
    console.error('[admin] getServiceLines:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Service Lines.' });
  }
};

exports.criarServiceLine = async (req, res) => {
  const { nome, descricao, idLearningPath } = req.body;
  if (!nome || !idLearningPath) {
    return res.status(400).json({ error: 'nome e idLearningPath são obrigatórios.' });
  }

  try {
    const lp = await LearningPath.findOne({ where: { idLearningPath } });
    if (!lp) return res.status(404).json({ error: 'Learning Path não encontrado.' });

    const sl = await ServiceLine.create({
      nomeSl: nome,
      descricao: descricao || null,
      idLearningPath,
      ativo: 1,
    });
    return res.status(201).json({ message: 'Service Line criada.', id: sl.idServiceLine });
  } catch (err) {
    console.error('[admin] criarServiceLine:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Service Line.' });
  }
};

exports.editarServiceLine = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, ativo, idLearningPath } = req.body;

  try {
    const sl = await ServiceLine.findOne({ where: { idServiceLine: id } });
    if (!sl) return res.status(404).json({ error: 'Service Line não encontrada.' });

    await sl.update({
      nomeSl: nome ?? sl.nomeSl,
      descricao: descricao ?? sl.descricao,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : sl.ativo,
      idLearningPath: idLearningPath ?? sl.idLearningPath,
    });

    return res.json({ message: 'Service Line atualizada.' });
  } catch (err) {
    console.error('[admin] editarServiceLine:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Service Line.' });
  }
};

// Só elimina se não tiver Áreas associadas
exports.eliminarServiceLine = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temFilhos = await Area.findOne({ where: { idServiceLine: id } });
    if (temFilhos) {
      return res.status(409).json({ error: 'Não é possível eliminar: existem Áreas associadas.' });
    }

    const eliminado = await ServiceLine.destroy({ where: { idServiceLine: id } });
    if (!eliminado) return res.status(404).json({ error: 'Service Line não encontrada.' });

    return res.json({ message: 'Service Line eliminada.' });
  } catch (err) {
    console.error('[admin] eliminarServiceLine:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Service Line.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 4. GESTÃO DE ÁREAS
// ═══════════════════════════════════════════════════════════════
exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({ order: [['nomeArea', 'ASC']] });
    return res.json(areas.map(a => ({
      id: a.idArea,
      nome: a.nomeArea,
      descricao: a.descricao,
      ativo: a.ativo === 1,
      idServiceLine: a.idServiceLine,
    })));
  } catch (err) {
    console.error('[admin] getAreas:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Áreas.' });
  }
};

exports.criarArea = async (req, res) => {
  const { nome, descricao, idServiceLine } = req.body;
  if (!nome || !idServiceLine) {
    return res.status(400).json({ error: 'nome e idServiceLine são obrigatórios.' });
  }

  try {
    const sl = await ServiceLine.findOne({ where: { idServiceLine } });
    if (!sl) return res.status(404).json({ error: 'Service Line não encontrada.' });

    const area = await Area.create({
      nomeArea: nome,
      descricao: descricao || null,
      idServiceLine,
      ativo: 1,
    });
    return res.status(201).json({ message: 'Área criada.', id: area.idArea });
  } catch (err) {
    console.error('[admin] criarArea:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Área.' });
  }
};

exports.editarArea = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, ativo, idServiceLine } = req.body;

  try {
    const area = await Area.findOne({ where: { idArea: id } });
    if (!area) return res.status(404).json({ error: 'Área não encontrada.' });

    await area.update({
      nomeArea: nome ?? area.nomeArea,
      descricao: descricao ?? area.descricao,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : area.ativo,
      idServiceLine: idServiceLine ?? area.idServiceLine,
    });

    return res.json({ message: 'Área atualizada.' });
  } catch (err) {
    console.error('[admin] editarArea:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Área.' });
  }
};

// Só elimina se não tiver Níveis associados
exports.eliminarArea = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temFilhos = await Nivel.findOne({ where: { idArea: id } });
    if (temFilhos) {
      return res.status(409).json({ error: 'Não é possível eliminar: existem Níveis associados.' });
    }

    const eliminado = await Area.destroy({ where: { idArea: id } });
    if (!eliminado) return res.status(404).json({ error: 'Área não encontrada.' });

    return res.json({ message: 'Área eliminada.' });
  } catch (err) {
    console.error('[admin] eliminarArea:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Área.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 5. GESTÃO DE NÍVEIS
// ══════════════════════════════════════════════════════════════
exports.getNiveis = async (req, res) => {
  try {
    const niveis = await Nivel.findAll({ order: [['tipo', 'ASC']] });
    return res.json(niveis.map(n => ({
      id: n.idNivel,
      nome: n.nomeNivel,
      tipo: n.tipo,
      descricao: n.descricao,
      idArea: n.idArea,
    })));
  } catch (err) {
    console.error('[admin] getNiveis:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Níveis.' });
  }
};

exports.criarNivel = async (req, res) => {
  const { nome, tipo, descricao, idArea } = req.body;
  if (!nome || !idArea) {
    return res.status(400).json({ error: 'nome e idArea são obrigatórios.' });
  }

  const tiposValidos = ['A', 'B', 'C', 'D', 'E'];
  if (tipo && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `Tipo inválido. Valores aceites: ${tiposValidos.join(', ')}` });
  }

  try {
    const area = await Area.findOne({ where: { idArea } });
    if (!area) return res.status(404).json({ error: 'Área não encontrada.' });

    const nivel = await Nivel.create({
      nomeNivel: nome,
      tipo: tipo || null,
      descricao: descricao || null,
      idArea,
    });
    return res.status(201).json({ message: 'Nível criado.', id: nivel.idNivel });
  } catch (err) {
    console.error('[admin] criarNivel:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Nível.' });
  }
};

exports.editarNivel = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, tipo, descricao, idArea } = req.body;

  try {
    const nivel = await Nivel.findOne({ where: { idNivel: id } });
    if (!nivel) return res.status(404).json({ error: 'Nível não encontrado.' });

    await nivel.update({
      nomeNivel: nome ?? nivel.nomeNivel,
      tipo: tipo ?? nivel.tipo,
      descricao: descricao ?? nivel.descricao,
      idArea: idArea ?? nivel.idArea,
    });

    return res.json({ message: 'Nível atualizado.' });
  } catch (err) {
    console.error('[admin] editarNivel:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Nível.' });
  }
};

// Só elimina se não tiver Badges associados
exports.eliminarNivel = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temBadges = await BadgeRegular.findOne({ where: { idNivel: id } });
    if (temBadges) {
      return res.status(409).json({ error: 'Não é possível eliminar: existem Badges associados a este Nível.' });
    }

    const eliminado = await Nivel.destroy({ where: { idNivel: id } });
    if (!eliminado) return res.status(404).json({ error: 'Nível não encontrado.' });

    return res.json({ message: 'Nível eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarNivel:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Nível.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 6. GESTÃO DE BADGES REGULARES
// ═══════════════════════════════════════════════════════════════
exports.getBadgesRegulares = async (req, res) => {
  try {
    const badges = await BadgeRegular.findAll({ order: [['nomeBadge', 'ASC']] });
    return res.json(badges.map(b => ({
      id: b.idBadgeRegular,
      nome: b.nomeBadge,
      descricao: b.descricao,
      pontos: b.pontos,
      validadeDias: b.validadeDias,
      ativo: b.ativo === 1,
      urlImagem: b.urlImagemBadge,
      idNivel: b.idNivel,
      idArea: b.idArea,
      idServiceLine: b.idServiceLine,
      idLearningPath: b.idLearningPath,
    })));
  } catch (err) {
    console.error('[admin] getBadgesRegulares:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Badges Regulares.' });
  }
};

exports.criarBadgeRegular = async (req, res) => {
  const { nome, descricao, pontos, validadeDias, urlImagem, idNivel, idArea, idServiceLine, idLearningPath } = req.body;

  if (!nome || !idNivel) {
    return res.status(400).json({ error: 'nome e idNivel são obrigatórios.' });
  }

  try {
    const nivel = await Nivel.findOne({ where: { idNivel } });
    if (!nivel) return res.status(404).json({ error: 'Nível não encontrado.' });

    const badge = await BadgeRegular.create({
      nomeBadge: nome,
      descricao: descricao || null,
      pontos: pontos || null,
      validadeDias: validadeDias || null,
      urlImagemBadge: urlImagem || null,
      idNivel,
      idArea: idArea || null,
      idServiceLine: idServiceLine || null,
      idLearningPath: idLearningPath || null,
      ativo: 1,
    });

    return res.status(201).json({ message: 'Badge Regular criado.', id: badge.idBadgeRegular });
  } catch (err) {
    console.error('[admin] criarBadgeRegular:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Badge Regular.' });
  }
};

exports.editarBadgeRegular = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, pontos, validadeDias, urlImagem, ativo, idNivel, idArea, idServiceLine, idLearningPath } = req.body;

  try {
    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: id } });
    if (!badge) return res.status(404).json({ error: 'Badge não encontrado.' });

    await badge.update({
      nomeBadge: nome ?? badge.nomeBadge,
      descricao: descricao ?? badge.descricao,
      pontos: pontos ?? badge.pontos,
      validadeDias: validadeDias ?? badge.validadeDias,
      urlImagemBadge: urlImagem ?? badge.urlImagemBadge,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : badge.ativo,
      idNivel: idNivel ?? badge.idNivel,
      idArea: idArea ?? badge.idArea,
      idServiceLine: idServiceLine ?? badge.idServiceLine,
      idLearningPath: idLearningPath ?? badge.idLearningPath,
    });

    return res.json({ message: 'Badge Regular atualizado.' });
  } catch (err) {
    console.error('[admin] editarBadgeRegular:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Badge Regular.' });
  }
};

exports.eliminarBadgeRegular = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temCandidatura = await Candidatura.findOne({ where: { idBadgeRegular: id } });
    if (temCandidatura) {
      return res.status(409).json({ error: 'Não é possível eliminar: existem candidaturas associadas.' });
    }
    const temAtribuicoes = await BadgeUtilizador.findOne({ where: { idBadgeRegular: id } });
    if (temAtribuicoes) {
      return res.status(409).json({ error: 'Não é possível eliminar: badge já foi atribuído a utilizadores.' });
    }

    // Elimina primeiro os requisitos associados
    await Requisitos.destroy({ where: { idBadgeRegular: id } });

    const eliminado = await BadgeRegular.destroy({ where: { idBadgeRegular: id } });
    if (!eliminado) return res.status(404).json({ error: 'Badge não encontrado.' });

    return res.json({ message: 'Badge Regular eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarBadgeRegular:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Badge Regular.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 7. GESTÃO DE BADGES ESPECIAIS
// ═══════════════════════════════════════════════════════════════
exports.getBadgesEspeciais = async (req, res) => {
  try {
    const badges = await BadgeEspecial.findAll({ order: [['nomeBadgeEspecial', 'ASC']] });
    return res.json(badges.map(b => ({
      id: b.idBadgeEspecial,
      nome: b.nomeBadgeEspecial,
      descricao: b.descricao,
      pontos: b.pontos,
      validadeDias: b.validadeDias,
      ativo: b.ativo === 1,
      urlImagem: b.urlImagemEspecial,
      idLearningPath: b.idLearningPath,
    })));
  } catch (err) {
    console.error('[admin] getBadgesEspeciais:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Badges Especiais.' });
  }
};

exports.criarBadgeEspecial = async (req, res) => {
  const { nome, descricao, pontos, validadeDias, urlImagem, idLearningPath } = req.body;

  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

  try {
    const badge = await BadgeEspecial.create({
      nomeBadgeEspecial: nome,
      descricao: descricao || null,
      pontos: pontos || null,
      validadeDias: validadeDias || null,
      urlImagemEspecial: urlImagem || null,
      idLearningPath: idLearningPath || null,
      ativo: 1,
    });

    return res.status(201).json({ message: 'Badge Especial criado.', id: badge.idBadgeEspecial });
  } catch (err) {
    console.error('[admin] criarBadgeEspecial:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Badge Especial.' });
  }
};

exports.editarBadgeEspecial = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, pontos, validadeDias, urlImagem, ativo, idLearningPath } = req.body;

  try {
    const badge = await BadgeEspecial.findOne({ where: { idBadgeEspecial: id } });
    if (!badge) return res.status(404).json({ error: 'Badge Especial não encontrado.' });

    await badge.update({
      nomeBadgeEspecial: nome ?? badge.nomeBadgeEspecial,
      descricao: descricao ?? badge.descricao,
      pontos: pontos ?? badge.pontos,
      validadeDias: validadeDias ?? badge.validadeDias,
      urlImagemEspecial: urlImagem ?? badge.urlImagemEspecial,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : badge.ativo,
      idLearningPath: idLearningPath ?? badge.idLearningPath,
    });

    return res.json({ message: 'Badge Especial atualizado.' });
  } catch (err) {
    console.error('[admin] editarBadgeEspecial:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Badge Especial.' });
  }
};

exports.eliminarBadgeEspecial = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const temAtribuicoes = await BadgeUtilizador.findOne({ where: { idBadgeEspecial: id } });
    if (temAtribuicoes) {
      return res.status(409).json({ error: 'Não é possível eliminar: badge já foi atribuído a utilizadores.' });
    }

    const eliminado = await BadgeEspecial.destroy({ where: { idBadgeEspecial: id } });
    if (!eliminado) return res.status(404).json({ error: 'Badge Especial não encontrado.' });

    return res.json({ message: 'Badge Especial eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarBadgeEspecial:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Badge Especial.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 8. GESTÃO DE REQUISITOS
// ═══════════════════════════════════════════════════════════════
exports.getRequisitos = async (req, res) => {
  const where = {};
  if (req.query.idBadgeRegular) {
    where.idBadgeRegular = parseInt(req.query.idBadgeRegular);
  }

  try {
    const requisitos = await Requisitos.findAll({ where, order: [['idRequisito', 'ASC']] });
    return res.json(requisitos.map(r => ({
      id: r.idRequisito,
      idBadgeRegular: r.idBadgeRegular,
      nome: r.nomeRequisito,
      descricao: r.descricao,
    })));
  } catch (err) {
    console.error('[admin] getRequisitos:', err.message);
    return res.status(500).json({ error: 'Erro ao listar Requisitos.' });
  }
};

exports.criarRequisito = async (req, res) => {
  const { idBadgeRegular, nome, descricao } = req.body;
  if (!idBadgeRegular || !nome) {
    return res.status(400).json({ error: 'idBadgeRegular e nome são obrigatórios.' });
  }

  try {
    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular } });
    if (!badge) return res.status(404).json({ error: 'Badge Regular não encontrado.' });

    const req_ = await Requisitos.create({
      idBadgeRegular,
      nomeRequisito: nome,
      descricao: descricao || null,
    });
    return res.status(201).json({ message: 'Requisito criado.', id: req_.idRequisito });
  } catch (err) {
    console.error('[admin] criarRequisito:', err.message);
    return res.status(500).json({ error: 'Erro ao criar Requisito.' });
  }
};

exports.editarRequisito = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao } = req.body;

  try {
    const req_ = await Requisitos.findOne({ where: { idRequisito: id } });
    if (!req_) return res.status(404).json({ error: 'Requisito não encontrado.' });

    await req_.update({
      nomeRequisito: nome ?? req_.nomeRequisito,
      descricao: descricao ?? req_.descricao,
    });

    return res.json({ message: 'Requisito atualizado.' });
  } catch (err) {
    console.error('[admin] editarRequisito:', err.message);
    return res.status(500).json({ error: 'Erro ao editar Requisito.' });
  }
};

exports.eliminarRequisito = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const eliminado = await Requisitos.destroy({ where: { idRequisito: id } });
    if (!eliminado) return res.status(404).json({ error: 'Requisito não encontrado.' });

    return res.json({ message: 'Requisito eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarRequisito:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar Requisito.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 9. GESTÃO DE CANDIDATURAS (visão admin — todas)
// ═══════════════════════════════════════════════════════════════
exports.getCandidaturas = async (req, res) => {
  const where = {};

  if (req.query.idEstado) where.idEstadoAtual = parseInt(req.query.idEstado);
  if (req.query.idBadge) where.idBadgeRegular = parseInt(req.query.idBadge);
  if (req.query.dataInicio || req.query.dataFim) {
    where.dataCriacao = {};
    if (req.query.dataInicio) where.dataCriacao[Op.gte] = new Date(req.query.dataInicio);
    if (req.query.dataFim) where.dataCriacao[Op.lte] = new Date(req.query.dataFim);
  }

  try {
    const candidaturas = await Candidatura.findAll({
      where,
      order: [['dataCriacao', 'DESC']],
    });

    const resultado = await Promise.all(candidaturas.map(async (c) => {
      const estado = await EstadosCandidatura.findOne({ where: { idEstado: c.idEstadoAtual } });
      const candidato = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });

      return {
        numCandidatura: c.numCandidatura,
        idBadgeRegular: c.idBadgeRegular,
        nomeBadge: badge?.nomeBadge ?? 'Desconhecido',
        idCandidato: c.idCandidato,
        nomeCandidato: candidato?.nomeUtilizador ?? 'Desconhecido',
        idEstadoAtual: c.idEstadoAtual,
        nomeEstado: estado?.nomeEstado ?? 'Desconhecido',
        dataCriacao: c.dataCriacao,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[admin] getCandidaturas:', err.message);
    return res.status(500).json({ error: 'Erro ao listar candidaturas.' });
  }
};

exports.getDetalhesCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.numCandidatura);

  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada.' });

    const historico = await HistoricoCandidatura.findAll({
      where: { numCandidatura },
      order: [['dataAlteracao', 'ASC']],
    });

    const historicoFormatado = await Promise.all(historico.map(async (h) => {
      const estado = await EstadosCandidatura.findOne({ where: { idEstado: h.idEstadoAtual } });
      return {
        idTransacao: h.idTransacao,
        idResponsavel: h.idResponsavel,
        tipoResponsavel: h.tipoResponsavel,
        dataAlteracao: h.dataAlteracao,
        idEstadoAtual: h.idEstadoAtual,
        nomeEstado: estado?.nomeEstado ?? 'Desconhecido',
        comentario: h.comentario,
      };
    }));

    const { Evidencia } = require('../model/evidencia');
    const evidencias = await Evidencia.findAll({ where: { numCandidatura } });

    return res.json({
      numCandidatura,
      historico: historicoFormatado,
      evidencias: evidencias.map(e => ({
        id: e.idEvidencia,
        idRequisito: e.idRequisito,
        pathFicheiro: e.pathFicheiro,
        estado: e.estado,
      })),
    });
  } catch (err) {
    console.error('[admin] getDetalhesCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao obter detalhes da candidatura.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 10. AVISOS / INFORMAÇÕES GLOBAIS
// ═══════════════════════════════════════════════════════════════

// Lista todas as notificações do tipo 'aviso' (globais)
exports.getAvisos = async (req, res) => {
  try {
    const avisos = await Notificacao.findAll({
      where: { tipoNotificacao: 'aviso' },
      order: [['data', 'DESC']],
    });

    return res.json(avisos.map(a => ({
      id: a.idNotificacao,
      descricao: a.descricao,
      data: a.data,
      tipoNotificacao: a.tipoNotificacao,
    })));
  } catch (err) {
    console.error('[admin] getAvisos:', err.message);
    return res.status(500).json({ error: 'Erro ao listar avisos.' });
  }
};

// Cria um aviso e envia para todos os utilizadores ativos
exports.criarAviso = async (req, res) => {
  const { descricao } = req.body;
  if (!descricao) return res.status(400).json({ error: 'Descrição é obrigatória.' });

  try {
    const aviso = await Notificacao.create({
      tipoNotificacao: 'aviso',
      descricao,
      data: new Date(),
    });

    // Associa o aviso a todos os utilizadores ativos
    const utilizadores = await Utilizador.findAll({ where: { ativo: 1 } });
    const ligacoes = utilizadores.map(u => ({
      idUtilizador: u.idUtilizador,
      idNotificacao: aviso.idNotificacao,
      lida: false,
    }));

    await UtilizadorNotificacao.bulkCreate(ligacoes);

    return res.status(201).json({
      message: `Aviso criado e enviado para ${utilizadores.length} utilizadores.`,
      id: aviso.idNotificacao,
    });
  } catch (err) {
    console.error('[admin] criarAviso:', err.message);
    return res.status(500).json({ error: 'Erro ao criar aviso.' });
  }
};

// Elimina um aviso e todas as ligações utilizador-notificação
exports.eliminarAviso = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await UtilizadorNotificacao.destroy({ where: { idNotificacao: id } });
    const eliminado = await Notificacao.destroy({ where: { idNotificacao: id } });
    if (!eliminado) return res.status(404).json({ error: 'Aviso não encontrado.' });

    return res.json({ message: 'Aviso eliminado.' });
  } catch (err) {
    console.error('[admin] eliminarAviso:', err.message);
    return res.status(500).json({ error: 'Erro ao eliminar aviso.' });
  }
};


// ═══════════════════════════════════════════════════════════════
// 11. REPORTING / ESTATÍSTICAS (KPIs do dashboard)
// ═══════════════════════════════════════════════════════════════

// Devolve todos os KPIs de uma vez só para popular o dashboard
exports.getReporting = async (req, res) => {
  try {
    // Total de utilizadores registados
    const totalUtilizadores = await Utilizador.count();
    const totalAtivos = await Utilizador.count({ where: { ativo: 1 } });

    // Badges atribuídos (total)
    const totalBadgesAtribuidos = await BadgeUtilizador.count();

    // Candidaturas por estado
    const estados = await EstadosCandidatura.findAll();
    const candidaturasPorEstado = await Promise.all(estados.map(async (e) => ({
      idEstado: e.idEstado,
      nomeEstado: e.nomeEstado,
      total: await Candidatura.count({ where: { idEstadoAtual: e.idEstado } }),
    })));

    // Badges por Learning Path
    const lps = await LearningPath.findAll({ where: { ativo: 1 } });
    const badgesPorLP = await Promise.all(lps.map(async (lp) => ({
      idLearningPath: lp.idLearningPath,
      nomeLp: lp.nomeLp,
      total: await BadgeUtilizador.count({
        include: [{ model: BadgeRegular, where: { idLearningPath: lp.idLearningPath }, required: true }],
      }).catch(() => 0), // fallback sem associações Sequelize
    })));

    // Badges por nível (tipo A/B/C/D/E)
    const tiposNivel = ['A', 'B', 'C', 'D', 'E'];
    const badgesPorNivel = await Promise.all(tiposNivel.map(async (tipo) => {
      const nivelIds = (await Nivel.findAll({ where: { tipo } })).map(n => n.idNivel);
      const badgeIds = nivelIds.length
        ? (await BadgeRegular.findAll({ where: { idNivel: { [Op.in]: nivelIds } } })).map(b => b.idBadgeRegular)
        : [];

      const total = badgeIds.length
        ? await BadgeUtilizador.count({ where: { idBadgeRegular: { [Op.in]: badgeIds } } })
        : 0;

      return { tipo, total };
    }));

    // Badges atribuídos por mês (últimos 12 meses)
    const { Sequelize } = require('sequelize');
    const doze = new Date();
    doze.setMonth(doze.getMonth() - 12);

    const badgesPorMes = await BadgeUtilizador.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_atribuicao')), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('id_badge_utilizador')), 'total'],
      ],
      where: { dataAtribuicao: { [Op.gte]: doze } },
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_atribuicao'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_atribuicao')), 'ASC']],
      raw: true,
    });

    return res.json({
      totalUtilizadores,
      totalAtivos,
      totalBadgesAtribuidos,
      candidaturasPorEstado,
      badgesPorLP,
      badgesPorNivel,
      badgesPorMes: badgesPorMes.map(b => ({
        mes: b.mes,
        total: parseInt(b.total),
      })),
    });
  } catch (err) {
    console.error('[admin] getReporting:', err.message);
    return res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
};

exports.exportarUtilizadores = async (req, res) => {
  try {
    const utilizadores = await Utilizador.findAll({ order: [['nomeUtilizador', 'ASC']] });

    const dados = await Promise.all(utilizadores.map(async (u) => ({
      id: u.idUtilizador,
      nome: u.nomeUtilizador,
      email: u.email,
      perfil: await getPerfil(u.idUtilizador),
      ativo: u.ativo === 1 ? 'Sim' : 'Não',
      dataCriacao: u.dataCriacao,
      ultimoLogin: u.ultimoLogin,
    })));

    return res.json(dados);
  } catch (err) {
    console.error('[admin] exportarUtilizadores:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar utilizadores.' });
  }
};

// Exporta todos os badges (regulares + especiais) em JSON
exports.exportarBadges = async (req, res) => {
  try {
    const regulares = await BadgeRegular.findAll({ order: [['nomeBadge', 'ASC']] });
    const especiais = await BadgeEspecial.findAll({ order: [['nomeBadgeEspecial', 'ASC']] });

    const dadosRegulares = regulares.map(b => ({
      tipo: 'Regular',
      id: b.idBadgeRegular,
      nome: b.nomeBadge,
      pontos: b.pontos,
      validadeDias: b.validadeDias,
      ativo: b.ativo === 1 ? 'Sim' : 'Não',
    }));

    const dadosEspeciais = especiais.map(b => ({
      tipo: 'Especial',
      id: b.idBadgeEspecial,
      nome: b.nomeBadgeEspecial,
      pontos: b.pontos,
      validadeDias: b.validadeDias,
      ativo: b.ativo === 1 ? 'Sim' : 'Não',
    }));

    return res.json([...dadosRegulares, ...dadosEspeciais]);
  } catch (err) {
    console.error('[admin] exportarBadges:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar badges.' });
  }
};

exports.exportarCandidaturas = async (req, res) => {
  const where = {};
  if (req.query.idEstado) where.idEstadoAtual = parseInt(req.query.idEstado);
  if (req.query.dataInicio || req.query.dataFim) {
    where.dataCriacao = {};
    if (req.query.dataInicio) where.dataCriacao[Op.gte] = new Date(req.query.dataInicio);
    if (req.query.dataFim) where.dataCriacao[Op.lte] = new Date(req.query.dataFim);
  }

  try {
    const candidaturas = await Candidatura.findAll({ where, order: [['dataCriacao', 'DESC']] });

    const dados = await Promise.all(candidaturas.map(async (c) => {
      const estado = await EstadosCandidatura.findOne({ where: { idEstado: c.idEstadoAtual } });
      const candidato = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });

      return {
        numCandidatura: c.numCandidatura,
        badge: badge?.nomeBadge ?? '-',
        candidato: candidato?.nomeUtilizador ?? '-',
        email: candidato?.email ?? '-',
        estado: estado?.nomeEstado ?? '-',
        dataCriacao: c.dataCriacao,
      };
    }));

    return res.json(dados);
  } catch (err) {
    console.error('[admin] exportarCandidaturas:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar candidaturas.' });
  }
};

exports.getConsultoresSemestre = async (req, res) => {
  try {
    const { Sequelize } = require('sequelize')
    const seis = new Date()
    seis.setMonth(seis.getMonth() - 6)

    const dados = await Utilizador.findAll({
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_criacao')), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('id_utilizador')), 'total'],
      ],
      where: { dataCriacao: { [Op.gte]: seis } },
      include: [{ model: Consultor, required: true, attributes: [] }],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_criacao'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('data_criacao')), 'ASC']],
      raw: true,
    })

    return res.json(dados.map(d => ({
      mes: new Date(d.mes).toLocaleDateString('pt-PT', { month: '2-digit', day: '2-digit' }),
      total: parseInt(d.total),
    })))
  } catch (err) {
    console.error('[admin] getConsultoresSemestre:', err.message)
    return res.status(500).json({ error: 'Erro.' })
  }
};