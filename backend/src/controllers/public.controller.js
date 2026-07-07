// controllers/public.controller.js
// Endpoints PÚBLICOS, sem autenticação. Servem a página pública do site
// (Home, catálogo de badges, diretório de consultores, verificação individual).
// Nunca expor aqui dados sensíveis (email, password, etc.), só o que é
// suposto qualquer pessoa ver ao aceder ao link.

const BadgeRegular = require('../model/badgeRegular');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const Area = require('../model/area');
const ServiceLine = require('../model/serviceLine');
const Nivel = require('../model/nivel');
const Requisitos = require('../model/requisitos');
const { Op } = require('sequelize');

// Monta os dados públicos de um badge_regular (reutilizado em vários endpoints)
async function montarBadgePublico(b) {
  const total = await BadgeUtilizador.count({ where: { idBadgeRegular: b.idBadgeRegular } });
  const nivel = await Nivel.findOne({ where: { idNivel: b.idNivel } });
  const area = b.idArea ? await Area.findOne({ where: { idArea: b.idArea } }) : null;
  const serviceLine = b.idServiceLine ? await ServiceLine.findOne({ where: { idServiceLine: b.idServiceLine } }) : null;
  return {
    idBadgeRegular: b.idBadgeRegular,
    nomeBadge: b.nomeBadge,
    descricao: b.descricao,
    nomeNivel: nivel?.nomeNivel ?? '-',
    nomeArea: area?.nomeArea ?? null,
    nomeServiceLine: serviceLine?.nomeSl ?? null,
    totalConsultores: total,
    urlImagemBadge: b.urlImagemBadge ?? null,
  };
}

// GET /api/public/badges/verify/:token -> a página individual de verificação
exports.verificarBadge = async (req, res) => {
  try {
    const bu = await BadgeUtilizador.findOne({ where: { tokenValidacao: req.params.token } });
    if (!bu) return res.status(404).json({ error: 'Certificado não encontrado.' });

    const utilizador = await Utilizador.findOne({ where: { idUtilizador: bu.idUtilizador } });
    const consultor = await Consultor.findOne({ where: { idUtilizador: bu.idUtilizador } });
    const area = consultor?.idArea ? await Area.findOne({ where: { idArea: consultor.idArea } }) : null;

    let badge = null, nivel = null, serviceLine = null, requisitos = [];
    if (bu.idBadgeRegular) {
      badge = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
      if (badge) {
        nivel = await Nivel.findOne({ where: { idNivel: badge.idNivel } });
        serviceLine = badge.idServiceLine ? await ServiceLine.findOne({ where: { idServiceLine: badge.idServiceLine } }) : null;
        requisitos = await Requisitos.findAll({ where: { idBadgeRegular: badge.idBadgeRegular } });
      }
    }

    const agora = new Date();
    const expirado = !!(bu.dataExpiracao && new Date(bu.dataExpiracao) < agora);

    return res.json({
      nomeConsultor: utilizador?.nomeUtilizador ?? '-',
      urlFoto: utilizador?.urlFoto ?? null,
      nomeArea: area?.nomeArea ?? null,
      nomeBadge: badge?.nomeBadge ?? '-',
      descricao: badge?.descricao ?? '',
      nomeNivel: nivel?.nomeNivel ?? '-',
      nomeServiceLine: serviceLine?.nomeSl ?? null,
      pontos: badge?.pontos ?? 0,
      dataAtribuicao: bu.dataAtribuicao,
      dataExpiracao: bu.dataExpiracao,
      expirado,
      valido: !expirado && bu.valido !== 0,
      competencias: requisitos.map(r => r.nomeRequisito).filter(Boolean),
      urlImagemBadge: badge?.urlImagemBadge ?? null,
    });
  } catch (err) {
    console.error('[public] verificarBadge:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar certificado.' });
  }
};

// GET /api/public/destaques -> os 4 badges com mais consultores certificados (Home)
exports.getDestaques = async (req, res) => {
  try {
    const badges = await BadgeRegular.findAll({ where: { ativo: 1 } });
    const resultado = await Promise.all(badges.map(montarBadgePublico));
    resultado.sort((a, b) => b.totalConsultores - a.totalConsultores);
    return res.json(resultado.slice(0, 4));
  } catch (err) {
    console.error('[public] getDestaques:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar destaques.' });
  }
};

// GET /api/public/recentes -> os 4 badges obtidos mais recentemente (Home)
exports.getRecentes = async (req, res) => {
  try {
    const recentes = await BadgeUtilizador.findAll({
      where: { idBadgeRegular: { [Op.ne]: null }, tokenValidacao: { [Op.ne]: null } },
      order: [['dataAtribuicao', 'DESC']],
      limit: 4,
    });
    const resultado = await Promise.all(recentes.map(async (bu) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: bu.idUtilizador } });
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
      const nivel = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      return {
        nomeConsultor: utilizador?.nomeUtilizador ?? '-',
        urlFoto: utilizador?.urlFoto ?? null,
        nomeBadge: badge?.nomeBadge ?? '-',
        nomeNivel: nivel?.nomeNivel ?? '-',
        tokenValidacao: bu.tokenValidacao,
      };
    }));
    return res.json(resultado);
  } catch (err) {
    console.error('[public] getRecentes:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar recentes.' });
  }
};

// GET /api/public/badges -> catálogo completo (?area= filtra opcionalmente)
exports.getCatalogo = async (req, res) => {
  try {
    const badges = await BadgeRegular.findAll({ where: { ativo: 1 } });
    let resultado = await Promise.all(badges.map(montarBadgePublico));
    if (req.query.area) resultado = resultado.filter(b => b.nomeArea === req.query.area);
    return res.json(resultado);
  } catch (err) {
    console.error('[public] getCatalogo:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar catálogo.' });
  }
};

// GET /api/public/consultores -> diretório de consultores certificados (?area= filtra)
exports.getDiretorio = async (req, res) => {
  try {
    const consultores = await Consultor.findAll();
    let resultado = await Promise.all(consultores.map(async (c) => {
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      if (totalBadges === 0) return null; // só entram consultores com pelo menos 1 badge

      const utilizador = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const area = c.idArea ? await Area.findOne({ where: { idArea: c.idArea } }) : null;
      const ultimoBadge = await BadgeUtilizador.findOne({
        where: { idUtilizador: c.idUtilizador, idBadgeRegular: { [Op.ne]: null } },
        order: [['dataAtribuicao', 'DESC']],
      });

      let nomeBadge = '-', nomeNivel = '-';
      if (ultimoBadge?.idBadgeRegular) {
        const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: ultimoBadge.idBadgeRegular } });
        const nivel = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
        nomeBadge = badge?.nomeBadge ?? '-';
        nomeNivel = nivel?.nomeNivel ?? '-';
      }

      return {
        idUtilizador: c.idUtilizador,
        nome: utilizador?.nomeUtilizador ?? '-',
        urlFoto: utilizador?.urlFoto ?? null,
        nomeArea: area?.nomeArea ?? null,
        totalBadges,
        nomeBadge,
        nomeNivel,
        tokenValidacao: ultimoBadge?.tokenValidacao ?? null,
      };
    }));
    resultado = resultado.filter(Boolean);
    if (req.query.area) resultado = resultado.filter(c => c.nomeArea === req.query.area);
    return res.json(resultado);
  } catch (err) {
    console.error('[public] getDiretorio:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar diretório.' });
  }
};

