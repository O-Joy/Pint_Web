const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const Area = require('../model/area');
const TalentManager = require('../model/talentManager');
const SlLeader = require('../model/slleader');
const Administrador = require('../model/administrador');
const ServiceLine = require('../model/serviceLine');
const LearningPath = require('../model/learningPath');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Objetivo = require('../model/objetivo');
const { calcularRanking } = require('./gamification.controller');

// GET /api/areas
// Devolve todas as áreas activas para o dropdown das Definições
exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({
      where: { ativo: 1 },
      attributes: ['idArea', 'nomeArea'],
      order: [['nomeArea', 'ASC']],
    });

    const resposta = areas.map(a => ({
      id: a.idArea,
      nome: a.nomeArea,
    }));

    res.json(resposta);
  } catch (erro) {
    console.error('[GET /areas]', erro);
    res.status(500).json({ error: 'Erro ao obter áreas.' });
  }
};

// PUT /api/perfil/password
// Altera a password do consultor autenticado
exports.alterarPassword = async (req, res) => {
  const { passwordAtual, novaPassword } = req.body;
  const idUtilizador = req.user.idUtilizador;

  if (!passwordAtual || !novaPassword) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
  }

  if (novaPassword.length < 6) {
    return res.status(400).json({ error: 'A nova password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const utilizador = await Utilizador.findOne({
      where: { idUtilizador },
    });

    if (!utilizador) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    // Verifica se a password actual está correcta
    const passwordCorreta = await bcrypt.compare(passwordAtual, utilizador.passwordAsh);
    if (!passwordCorreta) {
      return res.status(401).json({ error: 'Password atual incorreta.' });
    }

    // Gera hash da nova password e guarda
    const novaHash = await bcrypt.hash(novaPassword, 10);
    await utilizador.update({ passwordAsh: novaHash });

    res.json({ message: 'Password alterada com sucesso.' });
  } catch (erro) {
    console.error('[PUT /perfil/password]', erro);
    res.status(500).json({ error: 'Erro ao alterar password.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/me
// Dados reais e atuais do perfil autenticado — usado pela página
// Perfil para não depender só do que ficou guardado no login
// (que nunca teve os números de badges/objetivos/ranking/pontos).
//
// NOTA: o Administrador não tem área/service line/learning path —
// não há tabela de apoio nenhuma com esses dados para este perfil.
// ─────────────────────────────────────────────────────────────
exports.getMeuPerfil = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const perfil = req.user.perfil;

  try {
    const utilizador = await Utilizador.findOne({ where: { idUtilizador } });
    if (!utilizador) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    const base = {
      id: utilizador.idUtilizador,
      nome: utilizador.nomeUtilizador,
      email: utilizador.email,
      urlFoto: utilizador.urlFoto,
      telefone: utilizador.telefone,
      urlLinkedin: utilizador.urlLinkedin,
      dataMembro: utilizador.dataCriacao,
      perfil,
      nomeArea: null,
      nomeServiceLine: null,
      nomeLearningPath: null,
    };

    if (perfil === 'consultor') {
      const consultor = await Consultor.findOne({ where: { idUtilizador } });

      if (consultor?.idArea) {
        const area = await Area.findOne({ where: { idArea: consultor.idArea } });
        if (area) {
          base.nomeArea = area.nomeArea;
          const sl = await ServiceLine.findOne({ where: { idServiceLine: area.idServiceLine } });
          if (sl) base.nomeServiceLine = sl.nomeSl;
        }
      }
      if (consultor?.idLearningPath) {
        const lp = await LearningPath.findOne({ where: { idLearningPath: consultor.idLearningPath } });
        if (lp) base.nomeLearningPath = lp.nomeLp;
      }

      const badgesValidas = await BadgeUtilizador.count({ where: { idUtilizador, valido: 1 } });
      const objetivosConcluidos = await Objetivo.count({ where: { idUtilizador, estado: 'Concluido' } });
      const ranking = await calcularRanking();
      const minhaPosicao = ranking.find((r) => r.idUtilizador === idUtilizador);

      base.totalBadges = badgesValidas;
      base.totalObjetivos = objetivosConcluidos;
      base.posicaoRanking = minhaPosicao?.posicao ?? null;
      base.totalPontos = minhaPosicao?.totalPontos ?? 0;
      base.idArea = consultor?.idArea ?? null;
    }

    if (perfil === 'talent_manager') {
      const tm = await TalentManager.findOne({ where: { idUtilizador } });
      if (tm?.idArea) {
        const area = await Area.findOne({ where: { idArea: tm.idArea } });
        if (area) base.nomeArea = area.nomeArea;
      }
      if (tm?.idServiceLine) {
        const sl = await ServiceLine.findOne({ where: { idServiceLine: tm.idServiceLine } });
        if (sl) {
          base.nomeServiceLine = sl.nomeSl;
          const lp = await LearningPath.findOne({ where: { idLearningPath: sl.idLearningPath } });
          if (lp) base.nomeLearningPath = lp.nomeLp;
        }
      }
      base.idArea = tm?.idArea ?? null;
      const { Op } = require('sequelize');
      const HistoricoCandidatura = require('../model/historicoCandidatura');
      const Sla = require('../model/sla');
      const BadgeRegular = require('../model/badgeRegular');

      const candidaturasValidadas = await HistoricoCandidatura.count({
        where: { idResponsavel: idUtilizador, idEstadoAtual: { [Op.in]: [3, 5] } },
      });

      const slasTM = await Sla.findAll({ where: { tipoPerfil: 'talent_manager' } });
      const slaMedio = slasTM.length > 0
        ? Math.round(slasTM.reduce((acc, s) => acc + s.horasMaxAcao, 0) / slasTM.length)
        : 0;

      const whereBadges = tm?.idArea ? { idArea: tm.idArea } : {};
      const badgesDisponiveis = await BadgeRegular.count({ where: whereBadges });
      const badgesArea = await BadgeRegular.findAll({ where: whereBadges, limit: 10 });

      base.candidaturasValidadas = candidaturasValidadas;
      base.relatoriosExportados = 0; // sem tabela de tracking de exportações ainda
      base.slaMedio = slaMedio;
      base.badgesDisponiveis = badgesDisponiveis;
      base.badgesAssinatura = badgesArea.map(b => ({
        id: b.idBadgeRegular,
        nome: b.nomeBadge,
        estado: 'Válido',
        slaMeses: b.validadeDias ? Math.round(b.validadeDias / 30) : null,
      }));
    }

    if (perfil === 'sl_leader') {
      const sll = await SlLeader.findOne({ where: { idUtilizador } });
      if (sll?.idServiceLine) {
        const sl = await ServiceLine.findOne({ where: { idServiceLine: sll.idServiceLine } });
        if (sl) {
          base.nomeServiceLine = sl.nomeSl;
          const lp = await LearningPath.findOne({ where: { idLearningPath: sl.idLearningPath } });
          if (lp) base.nomeLearningPath = lp.nomeLp;
        }
      }
      // SL Leader não tem id_area na sua tabela — não é possível editar/mostrar área para este perfil
    }

    // perfil === 'administrador' → fica só com os campos base (sem área/SL/LP, propositadamente)

    res.json(base);
  } catch (erro) {
    console.error('[GET /perfil/me]', erro);
    res.status(500).json({ error: 'Erro ao carregar perfil.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/perfil/me
// Edição do PRÓPRIO perfil — foto, telefone, linkedin e área
// (área só é aplicável a consultor e talent_manager; o sl_leader
// não tem coluna de área na BD, e o administrador não tem nenhuma
// destas relações).
// Body: { urlFoto, telefone, urlLinkedin, idArea }
// ─────────────────────────────────────────────────────────────
exports.editarMeuPerfil = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const perfil = req.user.perfil;
  const { urlFoto, telefone, urlLinkedin, idArea } = req.body;

  try {
    const utilizador = await Utilizador.findOne({ where: { idUtilizador } });
    if (!utilizador) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    await utilizador.update({
      ...(urlFoto !== undefined ? { urlFoto } : {}),
      ...(telefone !== undefined ? { telefone } : {}),
      ...(urlLinkedin !== undefined ? { urlLinkedin } : {}),
    });

    if (idArea !== undefined) {
      // idArea pode chegar como string vazia '' (nenhuma área escolhida) —
      // isso tem de virar NULL, nunca pode ir como '' para uma coluna INTEGER
      const idAreaFinal = idArea === '' || idArea === null ? null : parseInt(idArea, 10);

      if (perfil === 'consultor') {
        await Consultor.update({ idArea: idAreaFinal }, { where: { idUtilizador } });
      } else if (perfil === 'talent_manager') {
        await TalentManager.update({ idArea: idAreaFinal }, { where: { idUtilizador } });
      }
      // sl_leader / administrador → sem coluna de área, ignora silenciosamente
    }

    res.json({ message: 'Perfil atualizado com sucesso.' });
  } catch (erro) {
    console.error('[PUT /perfil/me]', erro);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/perfil/foto
// Endpoint ISOLADO só para a foto de perfil — propositadamente
// separado do PUT /perfil/me, para não mexer em nada do que já
// funciona. Recebe multipart/form-data, campo "foto".
// ─────────────────────────────────────────────────────────────
exports.uploadFotoPerfil = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { idUtilizador } });
    if (!utilizador) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    // Apaga a foto antiga do disco, se existir e for um ficheiro nosso
    // (só apaga caminhos relativos uploads/fotos/... — nunca um URL externo antigo)
    if (utilizador.urlFoto && utilizador.urlFoto.startsWith('uploads/fotos/')) {
      const caminhoAntigo = path.join(__dirname, '../../', utilizador.urlFoto);
      fs.unlink(caminhoAntigo, () => {}); // ignora erro (ex: já não existir)
    }

    const urlFoto = `uploads/fotos/${req.file.filename}`;
    await utilizador.update({ urlFoto });
    res.json({ message: 'Foto atualizada com sucesso.', urlFoto });
  } catch (erro) {
    console.error('[POST /perfil/foto]', erro);
    res.status(500).json({ error: 'Erro ao atualizar a foto.' });
  }
};