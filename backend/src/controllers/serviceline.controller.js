// serviceline_controller.js
const { Op } = require('sequelize');
const crypto = require('crypto');

const SlLeader              = require('../model/slleader');
const Utilizador            = require('../model/utilizador');
const Consultor             = require('../model/consultor');
const Area                  = require('../model/area');
const ServiceLine           = require('../model/serviceLine');
const BadgeRegular          = require('../model/badgeRegular');
const BadgeUtilizador       = require('../model/badgeUtilizador');
const Candidatura           = require('../model/candidatura');
const HistoricoCandidatura  = require('../model/historicoCandidatura');
const EstadosCandidatura    = require('../model/estadosCandidatura');
const Notificacao           = require('../model/notificacao');
const UtilizadorNotificacao = require('../model/utilizadorNotificacao');
const Pontuacao             = require('../model/pontuacao');
const Nivel                 = require('../model/nivel');
const Requisitos            = require('../model/requisitos');
const Evidencia             = require('../model/evidencia');
const BadgeEspecial         = require('../model/badgeEspecial');

// IDs da tabela ESTADOS_CANDIDATURA
const ESTADO_VALIDACAO_SLL   = 3;
const ESTADO_RETIFICACAO_SLL = 4;
const ESTADO_APROVADA        = 5;
const ESTADO_REJEITADA       = 6;

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════

//Controller para o dashboard
exports.getDashboard = async (req, res) => {
  try {
    const idUtilizador = req.user.idUtilizador;
    const slLeader = await SlLeader.findOne({ where: { idUtilizador } });
    if (!slLeader) return res.status(404).json({ error: 'SL Leader não encontrado.' });
    const idServiceLine = slLeader.idServiceLine;

    // IDs dos badges desta SL
    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);

    // IDs das áreas desta SL
    const areas = await Area.findAll({ where: { idServiceLine } });
    const idsAreas = areas.map(a => a.idArea);

    // Candidaturas a aguardar decisão do SL
    const pendentes = await Candidatura.count({
      where: {
        idEstadoAtual: ESTADO_VALIDACAO_SLL,
        idBadgeRegular: { [Op.in]: idsBadges },
      },
    });

    // Consultores na Service Line
    const consultores = await Consultor.count({
      where: { idArea: { [Op.in]: idsAreas } },
    });

    // Aprovações deste mês
    const inicioMes = new Date();
    inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);

    const historicosAprovados = await HistoricoCandidatura.findAll({
      where: {
        idEstadoAtual: ESTADO_APROVADA,
        dataAlteracao: { [Op.gte]: inicioMes },
      },
    });
    const numsCandAprovadas = historicosAprovados.map(h => h.numCandidatura);
    const aprovados = numsCandAprovadas.length > 0 ? await Candidatura.count({
          where: {
            numCandidatura: { [Op.in]: numsCandAprovadas },
            idBadgeRegular: { [Op.in]: idsBadges },
          },
        }) : 0;

    return res.json({ pendentes, consultores, aprovados, variacao: 0 });
  } catch (err) {
    console.error('[sl] getDashboard:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
};

exports.getTopConsultores = async (req, res) => {
  try {
    const idUtilizador = req.user.idUtilizador;
    const slLeader = await SlLeader.findOne({ where: { idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;

    const areas = await Area.findAll({ where: { idServiceLine } });
    const idsAreas = areas.map(a => a.idArea);

    const consultores = await Consultor.findAll({
      where: { idArea: { [Op.in]: idsAreas } },
    });

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u           = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      const pontuacoes  = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);

      return { nome: u?.nomeUtilizador ?? '-', urlFoto: u?.urlFoto ?? null, totalBadges, totalPontos };
    }));

    resultado.sort((a, b) => b.totalPontos - a.totalPontos);
    return res.json(resultado.slice(0, 10));
  } catch (err) {
    console.error('[sl] getTopConsultores:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar top consultores.' });
  }
};

exports.getEstatisticasMensais = async (req, res) => {
  try {
    const idUtilizador = req.user.idUtilizador;
    const slLeader = await SlLeader.findOne({ where: { idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;

    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);

    const candidaturas = await Candidatura.findAll({
      where: { idBadgeRegular: { [Op.in]: idsBadges } },
    });
    const numsCand = candidaturas.map(c => c.numCandidatura);
    if (numsCand.length === 0) return res.json([]);

    const seisAtras = new Date();
    seisAtras.setMonth(seisAtras.getMonth() - 6);

    const historicos = await HistoricoCandidatura.findAll({
      where: {
        numCandidatura: { [Op.in]: numsCand },
        idEstadoAtual: { [Op.in]: [ESTADO_APROVADA, ESTADO_REJEITADA] },
        dataAlteracao: { [Op.gte]: seisAtras },
      },
      order: [['dataAlteracao', 'ASC']],
    });

    // Agrupa por mês manualmente
    const porMes = {};
    historicos.forEach(h => {
      const d = new Date(h.dataAlteracao);
      const chave = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      if (!porMes[chave]) porMes[chave] = { mes: chave, aprovadas: 0, rejeitadas: 0 };
      if (h.idEstadoAtual === ESTADO_APROVADA)  porMes[chave].aprovadas++;
      if (h.idEstadoAtual === ESTADO_REJEITADA) porMes[chave].rejeitadas++;
    });

    return res.json(Object.values(porMes));
  } catch (err) {
    console.error('[sl] getEstatisticasMensais:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
};

// ═══════════════════════════════════════════════════════
// VALIDAÇÕES
// ═══════════════════════════════════════════════════════

exports.getCandidaturasEmValidacao = async (req, res) => {
  try {
    const idUtilizador = req.user.idUtilizador;
    const slLeader = await SlLeader.findOne({ where: { idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;

    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);

    const candidaturas = await Candidatura.findAll({
      where: {
        idEstadoAtual: ESTADO_VALIDACAO_SLL,
        idBadgeRegular: { [Op.in]: idsBadges },
      },
      order: [['dataCriacao', 'ASC']],
    });

    const resultado = await Promise.all(candidaturas.map(async (c) => {
      const candidato = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
      const badge     = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      const nivel     = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;

      return {
        numCandidatura: c.numCandidatura,
        dataCriacao:    c.dataCriacao,
        nomeConsultor:  candidato?.nomeUtilizador ?? '-',
        nomeBadge:      badge?.nomeBadge ?? '-',
        nomeNivel:      nivel?.nomeNivel ?? '-',
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] getCandidaturasEmValidacao:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar candidaturas.' });
  }
};

exports.getHistoricoCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.id);
  try {
    const historico = await HistoricoCandidatura.findAll({
      where: { numCandidatura },
      order: [['dataAlteracao', 'ASC']],
    });

    const resultado = await Promise.all(historico.map(async (h) => {
      const estado      = await EstadosCandidatura.findOne({ where: { idEstado: h.idEstadoAtual } });
      const responsavel = h.idResponsavel
        ? await Utilizador.findOne({ where: { idUtilizador: h.idResponsavel } })
        : null;
      return {
        dataAlteracao:   h.dataAlteracao,
        comentario:      h.comentario,
        tipoResponsavel: h.tipoResponsavel,
        nomeEstado:      estado?.nomeEstado ?? '-',
        nomeResponsavel: responsavel?.nomeUtilizador ?? 'Sistema',
        idEstadoAtual:   h.idEstadoAtual,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] getHistoricoCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
};

exports.getEvidenciasCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.id);
  try {
    const evidencias = await Evidencia.findAll({ where: { numCandidatura } });

    const resultado = await Promise.all(evidencias.map(async (e) => {
      const requisito = await Requisitos.findOne({ where: { idRequisito: e.idRequisito } });
      return {
        idEvidencia:    e.idEvidencia,
        pathFicheiro:   e.pathFicheiro,
        estado:         e.estado,
        nomeRequisito:  requisito?.nomeRequisito ?? '-',
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] getEvidenciasCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar evidências.' });
  }
};

exports.aprovarCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.id);
  const idResponsavel  = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada.' });

    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: candidatura.idBadgeRegular } });

    await candidatura.update({ idEstadoAtual: ESTADO_APROVADA });

    await HistoricoCandidatura.create({
      numCandidatura, idResponsavel, tipoResponsavel: 'sl_leader',
      dataAlteracao: new Date(), idEstadoAtual: ESTADO_APROVADA,
      comentario: 'Candidatura aprovada pelo Service Line Leader.',
    });

    const token = crypto.randomBytes(10).toString('hex');
    const badgeUtilizador = await BadgeUtilizador.create({
      idBadgeRegular: candidatura.idBadgeRegular,
      idUtilizador:   candidatura.idCandidato,
      dataAtribuicao: new Date(), valido: 1,
      tokenValidacao: token,
      urlPublico: `/badges/verify/${token}`,
    });

    if (badge?.pontos && badge.pontos > 0) {
      await Pontuacao.create({
        idBadgeUtilizador: badgeUtilizador.idBadgeUtilizador,
        idUtilizador: candidatura.idCandidato,
        qtPontos: badge.pontos, dataAtribuicao: new Date(),
      });
    }

    const notif = await Notificacao.create({
      numCandidatura, tipoNotificacao: 'aprovacao',
      descricao: `O teu badge "${badge?.nomeBadge}" foi aprovado!`,
      data: new Date(),
    });
    await UtilizadorNotificacao.create({ idUtilizador: candidatura.idCandidato, idNotificacao: notif.idNotificacao });

    return res.json({ success: true, message: 'Candidatura aprovada com sucesso.' });
  } catch (err) {
    console.error('[sl] aprovarCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao aprovar candidatura.' });
  }
};

exports.rejeitarCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.id);
  const { comentario } = req.body;
  const idResponsavel  = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada.' });
    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: candidatura.idBadgeRegular } });

    await candidatura.update({ idEstadoAtual: ESTADO_REJEITADA });
    await HistoricoCandidatura.create({
      numCandidatura, idResponsavel, tipoResponsavel: 'sl_leader',
      dataAlteracao: new Date(), idEstadoAtual: ESTADO_REJEITADA, comentario,
    });

    const notif = await Notificacao.create({
      numCandidatura, tipoNotificacao: 'rejeicao',
      descricao: `A tua candidatura ao badge "${badge?.nomeBadge}" foi rejeitada.`,
      data: new Date(),
    });
    await UtilizadorNotificacao.create({ idUtilizador: candidatura.idCandidato, idNotificacao: notif.idNotificacao });

    return res.json({ success: true, message: 'Candidatura rejeitada.' });
  } catch (err) {
    console.error('[sl] rejeitarCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao rejeitar candidatura.' });
  }
};

exports.devolverCandidatura = async (req, res) => {
  const numCandidatura = parseInt(req.params.id);
  const { comentario } = req.body;
  const idResponsavel  = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada.' });
    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: candidatura.idBadgeRegular } });

    await candidatura.update({ idEstadoAtual: ESTADO_RETIFICACAO_SLL });
    await HistoricoCandidatura.create({
      numCandidatura, idResponsavel, tipoResponsavel: 'sl_leader',
      dataAlteracao: new Date(), idEstadoAtual: ESTADO_RETIFICACAO_SLL, comentario,
    });

    const notif = await Notificacao.create({
      numCandidatura, tipoNotificacao: 'retificacao',
      descricao: `A tua candidatura ao badge "${badge?.nomeBadge}" foi devolvida para retificação.`,
      data: new Date(),
    });
    await UtilizadorNotificacao.create({ idUtilizador: candidatura.idCandidato, idNotificacao: notif.idNotificacao });

    return res.json({ success: true, message: 'Candidatura devolvida ao consultor.' });
  } catch (err) {
    console.error('[sl] devolverCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro ao devolver candidatura.' });
  }
};

// ═══════════════════════════════════════════════════════
// BADGES / CONSULTORES / NOTIFICAÇÕES
// ═══════════════════════════════════════════════════════

//Controller para ir buscar todos os badges (regulares + especiais)
exports.getBadges = async (req, res) => {
  try {
    // Todos os badges regulares ativos
    const badges = await BadgeRegular.findAll({ where: { ativo: 1 }, order: [['nomeBadge', 'ASC']] });
    const regulares = await Promise.all(badges.map(async (b) => {
      const nivel = await Nivel.findOne({ where: { idNivel: b.idNivel } });
      const area  = b.idArea ? await Area.findOne({ where: { idArea: b.idArea } }) : null;
      const sl    = b.idServiceLine ? await ServiceLine.findOne({ where: { idServiceLine: b.idServiceLine } }) : null;
      return {
        id: b.idBadgeRegular,
        nome: b.nomeBadge,
        descricao: b.descricao,
        pontos: b.pontos,
        urlImagem: b.urlImagemBadge,
        validadeDias: b.validadeDias,
        nomeNivel: nivel?.nomeNivel ?? '-',
        nomeArea: area?.nomeArea ?? null,
        nomeServiceLine: sl?.nomeSl ?? null,
        especial: false,
      };
    }));

    // Todos os badges especiais ativos
    const especiais = await BadgeEspecial.findAll({ where: { ativo: 1 }, order: [['nomeBadgeEspecial', 'ASC']] });
    const especiaisFormatados = especiais.map(b => ({
      id: b.idBadgeEspecial,
      nome: b.nomeBadgeEspecial,
      descricao: b.descricao,
      pontos: b.pontos,
      urlImagem: b.urlImagemEspecial,
      validadeDias: b.validadeDias,
      nomeNivel: null,
      nomeArea: null,
      nomeServiceLine: null,
      especial: true,
    }));

    return res.json({ regulares, especiais: especiaisFormatados });
  } catch (err) {
    console.error('[sl] getBadges:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar badges.' });
  }
};

//Controller para pesquisar todos os requisitos necessários para cada badge.
exports.getRequisitosBadge = async (req, res) => {
  try {
    const requisitos = await Requisitos.findAll({ where: { idBadgeRegular: parseInt(req.params.id) } });
    return res.json(requisitos.map(r => ({ id: r.idRequisito, nome: r.nomeRequisito, descricao: r.descricao })));
  } catch (err) { return res.status(500).json({ error: 'Erro ao carregar requisitos.' }); }
};

//Controller para ir buscar 
exports.getConsultores = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    if (!slLeader) {
      return res.status(404).json({ error: 'SL Leader não encontrado para este utilizador.' });
    }

    const areas = await Area.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const consultores = await Consultor.findAll({ where: { idArea: { [Op.in]: areas.map(a => a.idArea) } } });

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u           = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const area        = await Area.findOne({ where: { idArea: c.idArea } });
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      const pontuacoes  = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      return { idUtilizador: c.idUtilizador, nome: u?.nomeUtilizador ?? '-', email: u?.email ?? '-', nomeArea: area?.nomeArea ?? '-', totalBadges, totalPontos };
    }));

    resultado.sort((a, b) => b.totalPontos - a.totalPontos);
    return res.json(resultado);
  } catch (err) {
    console.error('[sl] getConsultores:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar consultores.' });
  }
};

exports.getRanking = exports.getConsultores;

exports.getNotificacoes = async (req, res) => {
  try {
    const ligacoes = await UtilizadorNotificacao.findAll({ where: { idUtilizador: req.user.idUtilizador } });
    const notificacoes = await Notificacao.findAll({
      where: { idNotificacao: { [Op.in]: ligacoes.map(l => l.idNotificacao) } },
      order: [['data', 'DESC']],
    });
    return res.json(notificacoes.map(n => ({ id: n.idNotificacao, tipo: n.tipoNotificacao, descricao: n.descricao, data: n.data })));
  } catch (err) { return res.status(500).json({ error: 'Erro ao carregar notificações.' }); }
};

// ═══════════════════════════════════════════════════════
// RELATÓRIOS — KPIs e Gráficos
// ═══════════════════════════════════════════════════════

exports.getRelatorioKpis = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;
    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);

    const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0,0,0,0);

    // Badges aprovados este mês
    const aprovadosIds = (await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: ESTADO_APROVADA, dataAlteracao: { [Op.gte]: inicioMes } },
    })).map(h => h.numCandidatura);
    const badgesAprovados = aprovadosIds.length > 0
      ? await Candidatura.count({ where: { numCandidatura: { [Op.in]: aprovadosIds }, idBadgeRegular: { [Op.in]: idsBadges } } })
      : 0;

    // Total candidaturas da SL
    const totalCand = idsBadges.length > 0
      ? await Candidatura.count({ where: { idBadgeRegular: { [Op.in]: idsBadges } } }) : 0;
    const taxaAprovacao = totalCand > 0 ? Math.round((badgesAprovados / totalCand) * 100) : 0;

    // Consultores com pelo menos 1 badge
    const areas = await Area.findAll({ where: { idServiceLine } });
    const consultores = await Consultor.findAll({ where: { idArea: { [Op.in]: areas.map(a => a.idArea) } } });
    let consultoresComBadge = 0;
    for (const c of consultores) {
      const total = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      if (total > 0) consultoresComBadge++;
    }

    return res.json({ badgesAprovados, taxaAprovacao, consultoresComBadge, mediaSLA: 48 });
  } catch (err) {
    console.error('[sl] getRelatorioKpis:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar KPIs.' });
  }
};

exports.getEvolucaoMensal = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const badges = await BadgeRegular.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json([]);

    const candidaturas = await Candidatura.findAll({ where: { idBadgeRegular: { [Op.in]: idsBadges } } });
    const numsCand = candidaturas.map(c => c.numCandidatura);
    if (numsCand.length === 0) return res.json([]);

    const oitoAtras = new Date(); oitoAtras.setMonth(oitoAtras.getMonth() - 8);
    const historicos = await HistoricoCandidatura.findAll({
      where: { numCandidatura: { [Op.in]: numsCand }, idEstadoAtual: ESTADO_APROVADA, dataAlteracao: { [Op.gte]: oitoAtras } },
      order: [['dataAlteracao', 'ASC']],
    });

    const porMes = {};
    historicos.forEach(h => {
      const d = new Date(h.dataAlteracao);
      const meses = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const chave = meses[d.getMonth()];
      porMes[chave] = (porMes[chave] || 0) + 1;
    });

    return res.json(Object.entries(porMes).map(([mes, total]) => ({ mes, total })));
  } catch (err) {
    console.error('[sl] getEvolucaoMensal:', err.message);
    return res.status(500).json({ error: 'Erro.' });
  }
};

exports.getBadgesPorNivel = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const badges = await BadgeRegular.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json([]);

    const atribuidos = await BadgeUtilizador.findAll({ where: { idBadgeRegular: { [Op.in]: idsBadges } } });
    const porNivel = {};
    for (const bu of atribuidos) {
      const badge = badges.find(b => b.idBadgeRegular === bu.idBadgeRegular);
      const nivel = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      const nome = nivel?.nomeNivel ?? 'Outro';
      porNivel[nome] = (porNivel[nome] || 0) + 1;
    }
    const total = Object.values(porNivel).reduce((a, b) => a + b, 0);
    return res.json(Object.entries(porNivel).map(([nome, count]) => ({
      nome, count, percentagem: total > 0 ? Math.round((count / total) * 100) : 0,
    })));
  } catch (err) {
    console.error('[sl] getBadgesPorNivel:', err.message);
    return res.status(500).json({ error: 'Erro.' });
  }
};

exports.getBadgesPorArea = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const areas = await Area.findAll({ where: { idServiceLine: slLeader.idServiceLine } });

    const resultado = await Promise.all(areas.map(async (a) => {
      const badgesArea = await BadgeRegular.findAll({ where: { idArea: a.idArea } });
      const idsBadges = badgesArea.map(b => b.idBadgeRegular);
      const aprovados = idsBadges.length > 0
        ? await Candidatura.count({ where: { idBadgeRegular: { [Op.in]: idsBadges }, idEstadoAtual: ESTADO_APROVADA } }) : 0;
      const emProcesso = idsBadges.length > 0
        ? await Candidatura.count({ where: { idBadgeRegular: { [Op.in]: idsBadges }, idEstadoAtual: { [Op.in]: [1,2,3] } } }) : 0;
      return { nome: a.nomeArea, aprovados, emProcesso };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] getBadgesPorArea:', err.message);
    return res.status(500).json({ error: 'Erro.' });
  }
};

exports.getCumprimentoSLA = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const badges = await BadgeRegular.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json({ percentagem: 0 });

    const candidaturas = await Candidatura.findAll({
      where: { idBadgeRegular: { [Op.in]: idsBadges }, idEstadoAtual: ESTADO_APROVADA },
    });

    let dentroPrazo = 0;
    for (const c of candidaturas) {
      const historicos = await HistoricoCandidatura.findAll({ where: { numCandidatura: c.numCandidatura }, order: [['dataAlteracao', 'ASC']] });
      const submissao = historicos.find(h => h.idEstadoAtual === 1);
      const aprovacao = historicos.find(h => h.idEstadoAtual === ESTADO_APROVADA);
      if (submissao && aprovacao) {
        const horas = (new Date(aprovacao.dataAlteracao) - new Date(submissao.dataAlteracao)) / (1000 * 60 * 60);
        if (horas <= 48) dentroPrazo++;
      }
    }

    const percentagem = candidaturas.length > 0 ? Math.round((dentroPrazo / candidaturas.length) * 100) : 0;
    return res.json({ percentagem, total: candidaturas.length, dentroPrazo });
  } catch (err) {
    console.error('[sl] getCumprimentoSLA:', err.message);
    return res.status(500).json({ error: 'Erro.' });
  }
};

// ═══════════════════════════════════════════════════════
// RELATÓRIOS — Exportações
// ═══════════════════════════════════════════════════════

// Candidaturas da SL (com filtros opcionais de data e estado)
exports.relCandidaturas = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;

    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json([]);

    const where = { idBadgeRegular: { [Op.in]: idsBadges } };
    if (req.query.dataInicio) where.dataCriacao = { ...where.dataCriacao, [Op.gte]: new Date(req.query.dataInicio) };
    if (req.query.dataFim)    where.dataCriacao = { ...where.dataCriacao, [Op.lte]: new Date(req.query.dataFim) };
    if (req.query.estado)     where.idEstadoAtual = parseInt(req.query.estado);

    const candidaturas = await Candidatura.findAll({ where, order: [['dataCriacao', 'DESC']] });

    const resultado = await Promise.all(candidaturas.map(async (c) => {
      const candidato = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
      const badge     = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      const nivel     = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      const estado    = await EstadosCandidatura.findOne({ where: { idEstado: c.idEstadoAtual } });
      const area      = badge?.idArea ? await Area.findOne({ where: { idArea: badge.idArea } }) : null;

      return {
        numCandidatura: c.numCandidatura,
        dataCriacao: c.dataCriacao,
        nomeConsultor: candidato?.nomeUtilizador ?? '-',
        nomeBadge: badge?.nomeBadge ?? '-',
        nomeNivel: nivel?.nomeNivel ?? '-',
        nomeArea: area?.nomeArea ?? '-',
        nomeEstado: estado?.nomeEstado ?? '-',
        idEstadoAtual: c.idEstadoAtual,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] relCandidaturas:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar relatório.' });
  }
};

// Pedidos (alias de relCandidaturas para exportação)
exports.exportarPedidos = exports.relCandidaturas;

// Badges atribuídos na SL
exports.exportarBadges = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const idServiceLine = slLeader.idServiceLine;

    const badges = await BadgeRegular.findAll({ where: { idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json([]);

    const atribuidos = await BadgeUtilizador.findAll({
      where: { idBadgeRegular: { [Op.in]: idsBadges } },
      order: [['dataAtribuicao', 'DESC']],
    });

    const resultado = await Promise.all(atribuidos.map(async (bu) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: bu.idUtilizador } });
      const badge      = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
      const nivel      = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      const area       = badge?.idArea ? await Area.findOne({ where: { idArea: badge.idArea } }) : null;

      return {
        idBadgeUtilizador: bu.idBadgeUtilizador,
        nomeConsultor: utilizador?.nomeUtilizador ?? '-',
        nomeBadge: badge?.nomeBadge ?? '-',
        nomeNivel: nivel?.nomeNivel ?? '-',
        nomeArea: area?.nomeArea ?? '-',
        dataAtribuicao: bu.dataAtribuicao,
        valido: bu.valido ? 'Sim' : 'Não',
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] exportarBadges:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar badges.' });
  }
};

// Consultores da SL
exports.exportarConsultores = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const areas = await Area.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const consultores = await Consultor.findAll({ where: { idArea: { [Op.in]: areas.map(a => a.idArea) } } });

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u           = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const area        = await Area.findOne({ where: { idArea: c.idArea } });
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      const pontuacoes  = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);

      return {
        nome: u?.nomeUtilizador ?? '-',
        email: u?.email ?? '-',
        nomeArea: area?.nomeArea ?? '-',
        totalBadges,
        totalPontos,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] exportarConsultores:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar consultores.' });
  }
};

// Aprovações da SL
exports.exportarAprovacoes = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    const badges = await BadgeRegular.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    if (idsBadges.length === 0) return res.json([]);

    const aprovadas = await Candidatura.findAll({
      where: { idBadgeRegular: { [Op.in]: idsBadges }, idEstadoAtual: ESTADO_APROVADA },
      order: [['dataCriacao', 'DESC']],
    });

    const resultado = await Promise.all(aprovadas.map(async (c) => {
      const candidato = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
      const badge     = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      const nivel     = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      const historico = await HistoricoCandidatura.findOne({
        where: { numCandidatura: c.numCandidatura, idEstadoAtual: ESTADO_APROVADA },
        order: [['dataAlteracao', 'DESC']],
      });

      return {
        numCandidatura: c.numCandidatura,
        nomeConsultor: candidato?.nomeUtilizador ?? '-',
        nomeBadge: badge?.nomeBadge ?? '-',
        nomeNivel: nivel?.nomeNivel ?? '-',
        dataAprovacao: historico?.dataAlteracao ?? c.dataCriacao,
        comentario: historico?.comentario ?? '-',
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[sl] exportarAprovacoes:', err.message);
    return res.status(500).json({ error: 'Erro ao exportar aprovações.' });
  }
};