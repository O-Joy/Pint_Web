// controllers/serviceline_gamification.js
const { Op } = require('sequelize');
const crypto = require('crypto');

const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Pontuacao = require('../model/pontuacao');
const SlLeader = require('../model/slleader');
const Area = require('../model/area');
const BadgeRegular = require('../model/badgeRegular');
const Candidatura = require('../model/candidatura');
const HistoricoCandidatura = require('../model/historicoCandidatura');

const ESTADO_APROVADA = 5;

exports.getRankingGlobal = async (req, res) => {
  try {
    // 1. Descobrir as áreas da Service Line do Leader logado
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    let idsAreasSL = [];
    if (slLeader) {
      const areas = await Area.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
      idsAreasSL = areas.map(a => a.idArea);
    }

    // 2. Vai buscar TODOS os consultores
    const consultores = await Consultor.findAll();

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      
      const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      
      return { 
        idUtilizador: c.idUtilizador, 
        nome: u?.nomeUtilizador ?? '-', 
        totalBadges, 
        totalPontos,
        isMinhaSL: idsAreasSL.includes(c.idArea) 
      };
    }));

    // Ordenar do maior para o menor
    resultado.sort((a, b) => b.totalPontos - a.totalPontos);
    return res.json(resultado);
  } catch (err) {
    console.error('[gamification] getRankingGlobal:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar ranking global.' });
  }
};

// ═══════════════════════════════════════════════════════
// ESTATÍSTICAS DA SERVICE LINE (crescimento, subida/descida, consistência, por área)
// Tudo calculado a partir de dados reais: Pontuacao.dataAtribuicao dá-nos quando
// cada ponto foi ganho, o que permite comparar períodos sem precisar de nenhuma
// tabela nova de histórico.
// ═══════════════════════════════════════════════════════
exports.getEstatisticasGamification = async (req, res) => {
  try {
    const slLeader = await SlLeader.findOne({ where: { idUtilizador: req.user.idUtilizador } });
    if (!slLeader) return res.status(404).json({ error: 'SL Leader não encontrado.' });

    const areas = await Area.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsAreas = areas.map(a => a.idArea);
    const consultores = await Consultor.findAll({ where: { idArea: { [Op.in]: idsAreas } } });

    const inicioMesAtual = new Date(); inicioMesAtual.setDate(1); inicioMesAtual.setHours(0, 0, 0, 0);
    const inicioMesAnterior = new Date(inicioMesAtual); inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    let somaMesAtual = 0, somaMesAnterior = 0;
    const porConsultor = [];

    for (const c of consultores) {
      const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });

      const pontosMesAtual = pontuacoes
        .filter(p => p.dataAtribuicao && new Date(p.dataAtribuicao) >= inicioMesAtual)
        .reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      const pontosMesAnterior = pontuacoes
        .filter(p => p.dataAtribuicao && new Date(p.dataAtribuicao) >= inicioMesAnterior && new Date(p.dataAtribuicao) < inicioMesAtual)
        .reduce((acc, p) => acc + (p.qtPontos || 0), 0);

      somaMesAtual += pontosMesAtual;
      somaMesAnterior += pontosMesAnterior;

      // Meses consecutivos (a contar do atual para trás) em que ganhou pelo menos 1 ponto
      let streak = 0;
      for (let i = 0; i < 12; i++) {
        const inicio = new Date(inicioMesAtual); inicio.setMonth(inicio.getMonth() - i);
        const fim = new Date(inicioMesAtual); fim.setMonth(fim.getMonth() - i + 1);
        const temPontos = pontuacoes.some(p => p.dataAtribuicao && new Date(p.dataAtribuicao) >= inicio && new Date(p.dataAtribuicao) < fim);
        if (temPontos) streak++; else break;
      }

      porConsultor.push({ idUtilizador: c.idUtilizador, nome: u?.nomeUtilizador ?? '-', pontosMesAtual, streak });
    }

    const crescimentoMedio = somaMesAnterior > 0
      ? Math.round(((somaMesAtual - somaMesAnterior) / somaMesAnterior) * 100)
      : (somaMesAtual > 0 ? 100 : 0);

    const maiorSubida       = [...porConsultor].sort((a, b) => b.pontosMesAtual - a.pontosMesAtual).slice(0, 3);
    const menorProgresso    = [...porConsultor].sort((a, b) => a.pontosMesAtual - b.pontosMesAtual).slice(0, 3);
    const maiorConsistencia = [...porConsultor].sort((a, b) => b.streak - a.streak).slice(0, 3);

    // Novos consultores este mês (Utilizador.dataCriacao)
    let novosConsultoresMes = 0;
    for (const c of consultores) {
      const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      if (u?.dataCriacao && new Date(u.dataCriacao) >= inicioMesAtual) novosConsultoresMes++;
    }

    // Badges aprovados este mês vs mês anterior (para o "+X% este mês" do KPI Badges Aprovados)
    const badges = await BadgeRegular.findAll({ where: { idServiceLine: slLeader.idServiceLine } });
    const idsBadges = badges.map(b => b.idBadgeRegular);
    const historicosAprovMes = idsBadges.length > 0 ? await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: ESTADO_APROVADA, dataAlteracao: { [Op.gte]: inicioMesAtual } },
    }) : [];
    const historicosAprovMesAnt = idsBadges.length > 0 ? await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: ESTADO_APROVADA, dataAlteracao: { [Op.gte]: inicioMesAnterior, [Op.lt]: inicioMesAtual } },
    }) : [];
    const numsAprovMes = historicosAprovMes.map(h => h.numCandidatura);
    const numsAprovMesAnt = historicosAprovMesAnt.map(h => h.numCandidatura);
    const badgesAprovadosMes = numsAprovMes.length > 0
      ? await Candidatura.count({ where: { numCandidatura: { [Op.in]: numsAprovMes }, idBadgeRegular: { [Op.in]: idsBadges } } }) : 0;
    const badgesAprovadosMesAnt = numsAprovMesAnt.length > 0
      ? await Candidatura.count({ where: { numCandidatura: { [Op.in]: numsAprovMesAnt }, idBadgeRegular: { [Op.in]: idsBadges } } }) : 0;
    const badgesAprovadosVariacao = badgesAprovadosMesAnt > 0
      ? Math.round(((badgesAprovadosMes - badgesAprovadosMesAnt) / badgesAprovadosMesAnt) * 100)
      : (badgesAprovadosMes > 0 ? 100 : 0);

    // Progresso da equipa por área = soma de pontos (todos os tempos) por área desta SL
    const progressoPorArea = await Promise.all(areas.map(async (a) => {
      const idsConsultoresArea = consultores.filter(c => c.idArea === a.idArea).map(c => c.idUtilizador);
      let total = 0;
      if (idsConsultoresArea.length > 0) {
        const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: { [Op.in]: idsConsultoresArea } } });
        total = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      }
      return { nomeArea: a.nomeArea, totalPontos: total };
    }));
    progressoPorArea.sort((a, b) => b.totalPontos - a.totalPontos);
    const maiorTotalArea = Math.max(1, ...progressoPorArea.map(a => a.totalPontos));

    // Evolução de pontos nos últimos 6 meses, para o gráfico "Total de Pontos na sua área"
    const seisAtras = new Date(inicioMesAtual); seisAtras.setMonth(seisAtras.getMonth() - 5);
    const idsConsultores = consultores.map(c => c.idUtilizador);
    const pontuacoesRecentes = idsConsultores.length > 0
      ? await Pontuacao.findAll({ where: { idUtilizador: { [Op.in]: idsConsultores }, dataAtribuicao: { [Op.gte]: seisAtras } } })
      : [];
    const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const evolucaoPontos = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(inicioMesAtual); d.setMonth(d.getMonth() - i);
      const inicio = new Date(d);
      const fim = new Date(d); fim.setMonth(fim.getMonth() + 1);
      const total = pontuacoesRecentes
        .filter(p => p.dataAtribuicao && new Date(p.dataAtribuicao) >= inicio && new Date(p.dataAtribuicao) < fim)
        .reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      evolucaoPontos.push({ mes: nomesMes[d.getMonth()], total });
    }

    return res.json({
      crescimentoMedio,
      novosConsultoresMes,
      badgesAprovadosVariacao,
      maiorSubida,
      menorProgresso,
      maiorConsistencia,
      progressoPorArea: progressoPorArea.map(a => ({ ...a, percentagem: Math.round((a.totalPontos / maiorTotalArea) * 100) })),
      evolucaoPontos,
    });
  } catch (err) {
    console.error('[gamification] getEstatisticasGamification:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar estatísticas de gamification.' });
  }
};