const Candidatura = require('../model/candidatura');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const BadgeRegular = require('../model/badgeRegular');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Pontuacao = require('../model/pontuacao');
const Nivel = require('../model/nivel');
const Area = require('../model/area');
const { Op } = require('sequelize');
const Requisitos = require('../model/requisitos');
const RegistoSla = require('../model/slaRegisto');
const Sla = require('../model/sla');
const path = require('path');
const Evidencia = require('../model/evidencia');
const HistoricoCandidatura = require('../model/historicoCandidatura');
const EstadosCandidatura = require('../model/estadosCandidatura');
const BadgeEspecial = require('../model/badgeEspecial');
const ServiceLine = require('../model/serviceLine');

// GET /api/tm/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const pendentes = await Candidatura.count({ where: { idEstadoAtual: 1 } })
    const consultores = await Consultor.count()
    const validadas = await Candidatura.count({
      where: { idEstadoAtual: { [Op.in]: [3, 5] } }
    })

    // Candidaturas este mês
    const inicioMesAtual = new Date()
    inicioMesAtual.setDate(1)
    inicioMesAtual.setHours(0, 0, 0, 0)

    // Candidaturas mês anterior
    const inicioMesAnterior = new Date(inicioMesAtual)
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1)
    const fimMesAnterior = new Date(inicioMesAtual)

    const esteMes = await Candidatura.count({
      where: { dataCriacao: { [Op.gte]: inicioMesAtual } }
    })

    const mesAnterior = await Candidatura.count({
      where: { dataCriacao: { [Op.gte]: inicioMesAnterior, [Op.lt]: fimMesAnterior } }
    })

    let variacao = 0
    if (mesAnterior > 0) {
      variacao = Math.round(((esteMes - mesAnterior) / mesAnterior) * 100)
    } else if (esteMes > 0) {
      variacao = 100
    }

    return res.json({ pendentes, consultores, validadas, variacao })
  } catch (err) {
    console.error('[tm] getDashboard:', err.message)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// GET /api/tm/candidaturas
exports.getCandidaturas = async (req, res) => {
  try {
    const candidaturas = await Candidatura.findAll({
      order: [['dataCriacao', 'DESC']],
    });

    const resultado = await Promise.all(candidaturas.map(async (c) => {
      let nomeBadge = '-', nomeNivel = '-', nomeArea = '-'
      let nomeConsultor = '-', emailConsultor = '-'

      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      if (badge) {
        nomeBadge = badge.nomeBadge;
        if (badge.idNivel) {
          const nivel = await Nivel.findOne({ where: { idNivel: badge.idNivel } });
          if (nivel) nomeNivel = nivel.nomeNivel;
        }
      }

      const consultor = await Consultor.findOne({ where: { idUtilizador: c.idCandidato } });
      if (consultor) {
        const utilizador = await Utilizador.findOne({ where: { idUtilizador: c.idCandidato } });
        if (utilizador) {
          nomeConsultor = utilizador.nomeUtilizador;
          emailConsultor = utilizador.email;
        }
        if (consultor.idArea) {
          const area = await Area.findOne({ where: { idArea: consultor.idArea } });
          if (area) nomeArea = area.nomeArea;
        }
      }

      const requisitosBadge = await Requisitos.findAll({ where: { idBadgeRegular: c.idBadgeRegular } });
      const nomesRequisitos = requisitosBadge.map(r => r.nomeRequisito).join(', ') || '-';

      let slaHoras = null;
      let slaEstado = 'ok';
      const registoSla = await RegistoSla.findOne({
        where: { numCandidatura: c.numCandidatura },
        order: [['dataAlteracao', 'DESC']],
      });
      if (registoSla) {
        const sla = await Sla.findOne({ where: { idSla: registoSla.idSla } });
        slaHoras = sla?.horasMaxAcao ?? null;
        if (registoSla.prazoUltrapassado) {
          slaEstado = 'estourado';
        } else {
          const horasRestantes = (new Date(registoSla.dataLimite) - new Date()) / (1000 * 60 * 60);
          slaEstado = slaHoras && horasRestantes <= slaHoras * 0.25 ? 'alerta' : 'ok';
        }
      }

      return {
        numCandidatura: c.numCandidatura,
        idBadgeRegular: c.idBadgeRegular,
        idEstadoAtual: c.idEstadoAtual,
        dataCriacao: c.dataCriacao,
        nomeBadge,
        nomeNivel,
        nomeArea,
        nomeConsultor,
        emailConsultor,
        nomesRequisitos,
        slaHoras,
        slaEstado,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getCandidaturas:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/consultores
exports.getConsultores = async (req, res) => {
  try {
    const consultores = await Consultor.findAll();

    const resultado = await Promise.all(consultores.map(async (c) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      let nomeArea = '-'
      if (c.idArea) {
        const area = await Area.findOne({ where: { idArea: c.idArea } });
        if (area) nomeArea = area.nomeArea;
      }
      return {
        id: c.idUtilizador,
        nome: utilizador?.nomeUtilizador || '-',
        email: utilizador?.email || '-',
        nomeArea,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getConsultores:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PUT /api/tm/candidaturas/:numCandidatura/aprovar
exports.aprovarCandidatura = async (req, res) => {
  const { numCandidatura } = req.params;
  const idResponsavel = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada' });

    await candidatura.update({ idEstadoAtual: 3 });

    const HistoricoCandidatura = require('../model/historicoCandidatura');
    await HistoricoCandidatura.create({
      numCandidatura,
      idResponsavel,
      tipoResponsavel: 'talent_manager',
      dataAlteracao: new Date(),
      idEstadoAtual: 3,
      comentario: 'Aprovado pelo Talent Manager.',
    });

    return res.json({ message: 'Candidatura aprovada.' });
  } catch (err) {
    console.error('[tm] aprovarCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PUT /api/tm/candidaturas/:numCandidatura/rejeitar
exports.rejeitarCandidatura = async (req, res) => {
  const { numCandidatura } = req.params;
  const { comentario } = req.body;
  const idResponsavel = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada' });

    await candidatura.update({ idEstadoAtual: 6 });

    const HistoricoCandidatura = require('../model/historicoCandidatura');
    await HistoricoCandidatura.create({
      numCandidatura,
      idResponsavel,
      tipoResponsavel: 'talent_manager',
      dataAlteracao: new Date(),
      idEstadoAtual: 6,
      comentario: comentario || 'Rejeitado pelo Talent Manager.',
    });

    return res.json({ message: 'Candidatura rejeitada.' });
  } catch (err) {
    console.error('[tm] rejeitarCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PUT /api/tm/candidaturas/:numCandidatura/devolver
exports.devolverCandidatura = async (req, res) => {
  const { numCandidatura } = req.params;
  const { comentario } = req.body;
  const idResponsavel = req.user.idUtilizador;
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada' });

    await candidatura.update({ idEstadoAtual: 2 });

    const HistoricoCandidatura = require('../model/historicoCandidatura');
    await HistoricoCandidatura.create({
      numCandidatura,
      idResponsavel,
      tipoResponsavel: 'talent_manager',
      dataAlteracao: new Date(),
      idEstadoAtual: 2,
      comentario: comentario || 'Devolvido pelo Talent Manager para retificação.',
    });

    return res.json({ message: 'Candidatura devolvida.' });
  } catch (err) {
    console.error('[tm] devolverCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/top-consultores
exports.getTopConsultores = async (req, res) => {
  try {
    const consultores = await Consultor.findAll()

    const resultado = await Promise.all(consultores.map(async (c) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } })
      
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } })
      
      const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } })
      const totalPontos = pontuacoes.reduce((sum, p) => sum + p.qtPontos, 0)

      let nomeArea = '-'
      if (c.idArea) {
        const area = await Area.findOne({ where: { idArea: c.idArea } })
        if (area) nomeArea = area.nomeArea
      }

      return {
        id: c.idUtilizador,
        nome: utilizador?.nomeUtilizador || '-',
        nomeArea,
        totalBadges,
        totalPontos,
      }
    }))

    const ordenado = resultado.sort((a, b) => b.totalPontos - a.totalPontos)
    return res.json(ordenado)
  } catch (err) {
    console.error('[tm] getTopConsultores:', err.message)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// GET /api/tm/estatisticas-mensais
exports.getEstatisticasMensais = async (req, res) => {
  try {
    const { QueryTypes } = require('sequelize')
    const sequelize = require('../config/database')


    const resultado = await sequelize.query(`
      SELECT 
        TO_CHAR(data_criacao, 'Mon') as mes,
        EXTRACT(MONTH FROM data_criacao) as num_mes,
        COUNT(CASE WHEN id_estado_atual IN (3, 5) THEN 1 END) as aprovadas,
        COUNT(CASE WHEN id_estado_atual = 6 THEN 1 END) as rejeitadas
      FROM candidatura
      GROUP BY TO_CHAR(data_criacao, 'Mon'), EXTRACT(MONTH FROM data_criacao)
      ORDER BY num_mes ASC
    `, { type: QueryTypes.SELECT })

    return res.json(resultado)
  } catch (err) {
    console.error('[tm] getEstatisticasMensais:', err.message)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// GET /api/tm/historico-badges
exports.getHistoricoBadges = async (req, res) => {
  try {
    const historico = await BadgeUtilizador.findAll({
      order: [['dataAtribuicao', 'DESC']],
    })

    const resultado = await Promise.all(historico.map(async (h) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: h.idUtilizador } })
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: h.idBadgeRegular } })
      
      let nomeArea = '-', nomeNivel = '-'
      if (badge?.idArea) {
        const area = await Area.findOne({ where: { idArea: badge.idArea } })
        if (area) nomeArea = area.nomeArea
      }
      if (badge?.idNivel) {
        const nivel = await Nivel.findOne({ where: { idNivel: badge.idNivel } })
        if (nivel) nomeNivel = nivel.nomeNivel
      }

      return {
        nomeBadge: badge?.nomeBadge || '-',
        nomeArea,
        nomeNivel,
        nomeConsultor: utilizador?.nomeUtilizador || '-',
        estado: h.ativo ? 'Obtido' : 'Em Processo',
        dataAtribuicao: h.dataAtribuicao,
      }
    }))

    return res.json(resultado)
  } catch (err) {
    console.error('[tm] getHistoricoBadges:', err.message)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

// GET /api/tm/candidaturas/:numCandidatura/detalhe
exports.getCandidaturaDetalhe = async (req, res) => {
  const numCandidatura = parseInt(req.params.numCandidatura);
  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura } });
    if (!candidatura) return res.status(404).json({ error: 'Candidatura não encontrada.' });

    const consultorUtilizador = await Utilizador.findOne({ where: { idUtilizador: candidatura.idCandidato } });

    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: candidatura.idBadgeRegular } });
    let nomeNivel = '-';
    if (badge?.idNivel) {
      const nivel = await Nivel.findOne({ where: { idNivel: badge.idNivel } });
      if (nivel) nomeNivel = nivel.nomeNivel;
    }

    const historico = await HistoricoCandidatura.findAll({
      where: { numCandidatura },
      order: [['dataAlteracao', 'DESC']],
    });
    const historicoFormatado = historico.map(h => ({
      titulo: h.comentario || 'Estado alterado',
      data: h.dataAlteracao,
    }));

    const requisitosBadge = await Requisitos.findAll({ where: { idBadgeRegular: candidatura.idBadgeRegular } });
    const evidencias = await Evidencia.findAll({ where: { numCandidatura } });

    const requisitos = requisitosBadge.map(r => {
      const ev = evidencias.find(e => e.idRequisito === r.idRequisito);
      return {
        idRequisito: r.idRequisito,
        nome: r.nomeRequisito,
        nivel: nomeNivel,
        estado: ev ? (ev.estado === 'validado' ? 'Validado' : ev.estado === 'rejeitado' ? 'Rejeitado' : 'Em validação') : 'Sem evidência',
        evidencia: ev ? {
          id: ev.idEvidencia,
          nomeFicheiro: ev.pathFicheiro.split(/[\\/]/).pop(),
          estado: ev.estado,
        } : null,
      };
    });

    const registoSla = await RegistoSla.findOne({ where: { numCandidatura }, order: [['dataAlteracao', 'DESC']] });
    let sla = null;
    if (registoSla) {
      const slaInfo = await Sla.findOne({ where: { idSla: registoSla.idSla } });
      sla = { dataInicio: registoSla.dataAlteracao, dataLimite: registoSla.dataLimite, horas: slaInfo?.horasMaxAcao ?? null };
    }

    return res.json({
      consultor: { nome: consultorUtilizador?.nomeUtilizador || '-', email: consultorUtilizador?.email || '-' },
      badge: { nome: badge?.nomeBadge || '-', nomeNivel, pontos: badge?.pontos ?? 0 },
      historico: historicoFormatado,
      sla,
      requisitos,
    });
  } catch (err) {
    console.error('[tm] getCandidaturaDetalhe:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PUT /api/tm/evidencias/:idEvidencia/validar
exports.validarEvidencia = async (req, res) => {
  const { idEvidencia } = req.params;
  try {
    const evidencia = await Evidencia.findOne({ where: { idEvidencia } });
    if (!evidencia) return res.status(404).json({ error: 'Evidência não encontrada.' });
    await evidencia.update({ estado: 'validado', idResponsavel: req.user.idUtilizador });
    return res.json({ message: 'Evidência validada.' });
  } catch (err) {
    console.error('[tm] validarEvidencia:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PUT /api/tm/evidencias/:idEvidencia/rejeitar
exports.rejeitarEvidencia = async (req, res) => {
  const { idEvidencia } = req.params;
  try {
    const evidencia = await Evidencia.findOne({ where: { idEvidencia } });
    if (!evidencia) return res.status(404).json({ error: 'Evidência não encontrada.' });
    await evidencia.update({ estado: 'rejeitado', idResponsavel: req.user.idUtilizador });
    return res.json({ message: 'Evidência rejeitada.' });
  } catch (err) {
    console.error('[tm] rejeitarEvidencia:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/evidencias/:idEvidencia/download
exports.downloadEvidencia = async (req, res) => {
  const { idEvidencia } = req.params;
  try {
    const evidencia = await Evidencia.findOne({ where: { idEvidencia } });
    if (!evidencia) return res.status(404).json({ error: 'Evidência não encontrada.' });
    const caminho = path.isAbsolute(evidencia.pathFicheiro)
      ? evidencia.pathFicheiro
      : path.join(__dirname, '../../', evidencia.pathFicheiro);
    return res.download(caminho);
  } catch (err) {
    console.error('[tm] downloadEvidencia:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

const ESTADOS_APROVADAS_TM = [3, 5]; // passou pelo TM com sucesso (enviado ao SLL ou já final aprovado)
const ESTADO_REJEITADA = 6;

// GET /api/tm/relatorios/kpis
exports.getRelatorioKpis = async (req, res) => {
  try {
    const inicioMesAtual = new Date(); inicioMesAtual.setDate(1); inicioMesAtual.setHours(0, 0, 0, 0);
    const inicioMesAnterior = new Date(inicioMesAtual); inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

    const historicosAprovMes = await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: 3, dataAlteracao: { [Op.gte]: inicioMesAtual } },
    });
    const historicosAprovMesAnt = await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: 3, dataAlteracao: { [Op.gte]: inicioMesAnterior, [Op.lt]: inicioMesAtual } },
    });
    const badgesAprovados = historicosAprovMes.length;
    const badgesAprovadosMesAnt = historicosAprovMesAnt.length;
    const badgesAprovadosVariacao = badgesAprovadosMesAnt > 0
      ? Math.round(((badgesAprovados - badgesAprovadosMesAnt) / badgesAprovadosMesAnt) * 100)
      : (badgesAprovados > 0 ? 100 : 0);

    const totalAprovadas = await Candidatura.count({ where: { idEstadoAtual: { [Op.in]: ESTADOS_APROVADAS_TM } } });
    const totalRejeitadas = await Candidatura.count({ where: { idEstadoAtual: ESTADO_REJEITADA } });
    const totalDecididas = totalAprovadas + totalRejeitadas;
    const taxaAprovacao = totalDecididas > 0 ? Math.round((totalAprovadas / totalDecididas) * 100) : 0;

    const consultoresAtivos = await Consultor.count();

    const registosSla = await RegistoSla.findAll();
    const dentroPrazo = registosSla.filter(r => !r.prazoUltrapassado).length;
    const mediaSLA = registosSla.length > 0 ? Math.round((dentroPrazo / registosSla.length) * 100) : 0;

    return res.json({ badgesAprovados, badgesAprovadosVariacao, taxaAprovacao, consultoresAtivos, mediaSLA });
  } catch (err) {
    console.error('[tm] getRelatorioKpis:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/evolucao-mensal
exports.getEvolucaoMensalRelatorio = async (req, res) => {
  try {
    const inicio = req.query.dataInicio ? new Date(req.query.dataInicio) : (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; })();
    const fim = req.query.dataFim ? new Date(req.query.dataFim + 'T23:59:59') : new Date();

    let idsBadges = null;
    if (req.query.nivel) {
      const niveis = await Nivel.findAll({ where: { nomeNivel: req.query.nivel } });
      const idsNiveis = niveis.map(n => n.idNivel);
      const badges = await BadgeRegular.findAll({ where: { idNivel: { [Op.in]: idsNiveis } } });
      idsBadges = badges.map(b => b.idBadgeRegular);
    }

    const historicos = await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: 3, dataAlteracao: { [Op.gte]: inicio, [Op.lte]: fim } },
      order: [['dataAlteracao', 'ASC']],
    });

    const meses = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const porMes = {};
    for (const h of historicos) {
      if (idsBadges) {
        const cand = await Candidatura.findOne({ where: { numCandidatura: h.numCandidatura } });
        if (!cand || !idsBadges.includes(cand.idBadgeRegular)) continue;
      }
      const chave = meses[new Date(h.dataAlteracao).getMonth()];
      porMes[chave] = (porMes[chave] || 0) + 1;
    }

    // Preenche todos os meses do intervalo, mesmo os que têm 0 aprovações,
    // para o gráfico mostrar sempre os 6 meses e não só os que têm dados
    const resultado = [];
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const fimCursor = new Date(fim.getFullYear(), fim.getMonth(), 1);
    while (cursor <= fimCursor) {
      const chave = meses[cursor.getMonth()];
      resultado.push({ mes: chave, total: porMes[chave] || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getEvolucaoMensalRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/por-area
exports.getBadgesPorAreaRelatorio = async (req, res) => {
  try {
    const areas = await Area.findAll();
    const inicioMesAtual = new Date(); inicioMesAtual.setDate(1); inicioMesAtual.setHours(0, 0, 0, 0);
    const inicioMesAnterior = new Date(inicioMesAtual); inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
    const labelMesAtual = `${String(inicioMesAtual.getMonth() + 1).padStart(2, '0')}/${String(inicioMesAtual.getFullYear()).slice(-2)}`;
    const labelMesAnterior = `${String(inicioMesAnterior.getMonth() + 1).padStart(2, '0')}/${String(inicioMesAnterior.getFullYear()).slice(-2)}`;

    const historicosMesAtual = await HistoricoCandidatura.findAll({ where: { idEstadoAtual: 3, dataAlteracao: { [Op.gte]: inicioMesAtual } } });
    const historicosMesAnterior = await HistoricoCandidatura.findAll({ where: { idEstadoAtual: 3, dataAlteracao: { [Op.gte]: inicioMesAnterior, [Op.lt]: inicioMesAtual } } });
    const numsMesAtual = historicosMesAtual.map(h => h.numCandidatura);
    const numsMesAnterior = historicosMesAnterior.map(h => h.numCandidatura);

    const resultado = await Promise.all(areas.map(async (a) => {
      const badgesArea = await BadgeRegular.findAll({ where: { idArea: a.idArea } });
      const idsBadges = badgesArea.map(b => b.idBadgeRegular);
      if (idsBadges.length === 0) return { nome: a.nomeArea, mesAnterior: 0, mesAtual: 0 };
      const mesAtual = numsMesAtual.length > 0 ? await Candidatura.count({ where: { numCandidatura: { [Op.in]: numsMesAtual }, idBadgeRegular: { [Op.in]: idsBadges } } }) : 0;
      const mesAnterior = numsMesAnterior.length > 0 ? await Candidatura.count({ where: { numCandidatura: { [Op.in]: numsMesAnterior }, idBadgeRegular: { [Op.in]: idsBadges } } }) : 0;
      return { nome: a.nomeArea, mesAnterior, mesAtual };
    }));

    return res.json({ labelMesAnterior, labelMesAtual, areas: resultado });
  } catch (err) {
    console.error('[tm] getBadgesPorAreaRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/por-nivel
exports.getBadgesPorNivelRelatorio = async (req, res) => {
  try {
    const atribuidos = await BadgeUtilizador.findAll();
    const porNivel = {};
    for (const bu of atribuidos) {
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
      const nivel = badge?.idNivel ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
      const nome = nivel?.nomeNivel ?? 'Outro';
      porNivel[nome] = (porNivel[nome] || 0) + 1;
    }
    const total = Object.values(porNivel).reduce((a, b) => a + b, 0);
    return res.json(Object.entries(porNivel).map(([nome, count]) => ({
      nome, count, percentagem: total > 0 ? Math.round((count / total) * 100) : 0,
    })));
  } catch (err) {
    console.error('[tm] getBadgesPorNivelRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/sla
exports.getSlaRelatorio = async (req, res) => {
  try {
    const registos = await RegistoSla.findAll();
    const dentroPrazo = registos.filter(r => !r.prazoUltrapassado).length;
    const percentagem = registos.length > 0 ? Math.round((dentroPrazo / registos.length) * 100) : 0;
    return res.json({ percentagem, total: registos.length, dentroPrazo });
  } catch (err) {
    console.error('[tm] getSlaRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/exportar-badges
exports.exportarBadgesRelatorio = async (req, res) => {
  try {
    const atribuidos = await BadgeUtilizador.findAll({ order: [['dataAtribuicao', 'DESC']] });
    const resultado = await Promise.all(atribuidos.map(async (bu) => {
      const utilizador = await Utilizador.findOne({ where: { idUtilizador: bu.idUtilizador } });
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
      let nomeNivel = '-', nomeArea = '-';
      if (badge?.idNivel) { const n = await Nivel.findOne({ where: { idNivel: badge.idNivel } }); if (n) nomeNivel = n.nomeNivel; }
      if (badge?.idArea) { const a = await Area.findOne({ where: { idArea: badge.idArea } }); if (a) nomeArea = a.nomeArea; }
      return {
        nomeConsultor: utilizador?.nomeUtilizador || '-',
        nomeBadge: badge?.nomeBadge || '-',
        nomeNivel, nomeArea,
        dataAtribuicao: bu.dataAtribuicao,
        valido: bu.ativo ? 'Sim' : 'Não',
      };
    }));
    return res.json(resultado);
  } catch (err) {
    console.error('[tm] exportarBadgesRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/exportar-pedidos
exports.exportarPedidosRelatorio = async (req, res) => {
  try {
    req.query = {};
    return exports.getCandidaturas(req, res);
  } catch (err) {
    console.error('[tm] exportarPedidosRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/relatorios/exportar-consultores
exports.exportarConsultoresRelatorio = async (req, res) => {
  return exports.getTopConsultores(req, res);
};

// GET /api/tm/relatorios/exportar-validacoes?tipos=aprovacoes,rejeicoes
exports.exportarValidacoesRelatorio = async (req, res) => {
  try {
    const tipos = (req.query.tipos || 'aprovacoes,rejeicoes').split(',');
    const estados = [];
    if (tipos.includes('aprovacoes')) estados.push(3, 5);
    if (tipos.includes('rejeicoes')) estados.push(6);

    const historicos = await HistoricoCandidatura.findAll({
      where: { idEstadoAtual: { [Op.in]: estados }, tipoResponsavel: 'talent_manager' },
      order: [['dataAlteracao', 'DESC']],
    });

    const resultado = await Promise.all(historicos.map(async (h) => {
      const candidatura = await Candidatura.findOne({ where: { numCandidatura: h.numCandidatura } });
      const badge = candidatura ? await BadgeRegular.findOne({ where: { idBadgeRegular: candidatura.idBadgeRegular } }) : null;
      const utilizadorResp = h.idResponsavel ? await Utilizador.findOne({ where: { idUtilizador: h.idResponsavel } }) : null;
      const utilizadorConsultor = candidatura ? await Utilizador.findOne({ where: { idUtilizador: candidatura.idCandidato } }) : null;
      return {
        nomeConsultor: utilizadorConsultor?.nomeUtilizador || '-',
        nomeBadge: badge?.nomeBadge || '-',
        nomeEstado: h.idEstadoAtual === 6 ? 'Rejeitada' : 'Aprovada',
        dataValidacao: h.dataAlteracao,
        responsavel: utilizadorResp?.nomeUtilizador || '-',
        comentario: h.comentario || '-',
      };
    }));
    return res.json(resultado);
  } catch (err) {
    console.error('[tm] exportarValidacoesRelatorio:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

const ESTADOS_EM_PROCESSO = [1, 2, 3, 4];
const ESTADO_RASCUNHO = 0;

// GET /api/tm/consultores (lista completa, para a tabela)
exports.getConsultoresLista = async (req, res) => {
  try {
    const consultores = await Consultor.findAll();

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });

      const badgesUtilizador = await BadgeUtilizador.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalBadges = badgesUtilizador.length;

      const candidaturas = await Candidatura.findAll({ where: { idCandidato: c.idUtilizador } });
      const badgesEmProcesso = candidaturas.filter(cand => ESTADOS_EM_PROCESSO.includes(cand.idEstadoAtual)).length;

      const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);

      let nomeArea = '-', nomeServiceLine = '-';
      if (c.idArea) {
        const area = await Area.findOne({ where: { idArea: c.idArea } });
        if (area) {
          nomeArea = area.nomeArea;
          if (area.idServiceLine) {
            const sl = await ServiceLine.findOne({ where: { idServiceLine: area.idServiceLine } });
            if (sl) nomeServiceLine = sl.nomeSl;
          }
        }
      }

      const datas = [
        ...badgesUtilizador.map(b => b.dataAtribuicao),
        ...candidaturas.map(cand => cand.dataCriacao),
        u?.ultimoLogin,
      ].filter(Boolean).map(d => new Date(d));
      const ultimaAtividade = datas.length > 0 ? new Date(Math.max(...datas)) : null;

      return {
        idUtilizador: c.idUtilizador,
        nome: u?.nomeUtilizador ?? '-',
        email: u?.email ?? '-',
        urlFoto: u?.urlFoto ?? null,
        nomeArea, nomeServiceLine,
        totalBadges, badgesEmProcesso, totalPontos, ultimaAtividade,
      };
    }));

    resultado.sort((a, b) => b.totalPontos - a.totalPontos);
    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getConsultoresLista:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar consultores.' });
  }
};

// GET /api/tm/consultores/:id
exports.getConsultorDetalheTM = async (req, res) => {
  try {
    const idUtilizador = parseInt(req.params.id, 10);
    if (Number.isNaN(idUtilizador)) return res.status(400).json({ error: 'Id inválido.' });

    const consultor = await Consultor.findOne({ where: { idUtilizador } });
    if (!consultor) return res.status(404).json({ error: 'Consultor não encontrado.' });

    const u = await Utilizador.findOne({ where: { idUtilizador } });
    const area = consultor.idArea ? await Area.findOne({ where: { idArea: consultor.idArea } }) : null;
    let nomeServiceLine = '-';
    if (area?.idServiceLine) {
      const sl = await ServiceLine.findOne({ where: { idServiceLine: area.idServiceLine } });
      if (sl) nomeServiceLine = sl.nomeSl;
    }

    const todosEstados = await EstadosCandidatura.findAll();
    const estadosMap = {};
    todosEstados.forEach(e => { estadosMap[e.idEstado] = e.nomeEstado; });

    const badgesUtilizador = await BadgeUtilizador.findAll({ where: { idUtilizador }, order: [['dataAtribuicao', 'DESC']] });

    const badgesObtidos = [];
    const badgesEspeciais = [];
    for (const bu of badgesUtilizador) {
      if (bu.idBadgeRegular) {
        const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
        const nivel = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;
        const areaBadge = badge?.idArea ? await Area.findOne({ where: { idArea: badge.idArea } }) : null;
        badgesObtidos.push({
          idBadgeUtilizador: bu.idBadgeUtilizador,
          nomeBadge: badge?.nomeBadge ?? '-',
          nomeArea: areaBadge?.nomeArea ?? area?.nomeArea ?? '-',
          nomeNivel: nivel?.nomeNivel ?? '-',
          pontos: badge?.pontos ?? 0,
          dataAtribuicao: bu.dataAtribuicao,
          dataExpiracao: bu.dataExpiracao,
        });
      } else if (bu.idBadgeEspecial) {
        const be = await BadgeEspecial.findOne({ where: { idBadgeEspecial: bu.idBadgeEspecial } });
        badgesEspeciais.push({
          idBadgeUtilizador: bu.idBadgeUtilizador,
          nomeBadgeEspecial: be?.nomeBadgeEspecial ?? '-',
          pontos: be?.pontos ?? 0,
          dataAtribuicao: bu.dataAtribuicao,
          dataExpiracao: bu.dataExpiracao,
        });
      }
    }

    const candidaturas = await Candidatura.findAll({
      where: { idCandidato: idUtilizador, idEstadoAtual: { [Op.ne]: ESTADO_RASCUNHO } },
      order: [['dataCriacao', 'DESC']],
    });

    const badgesEmProgresso = [];
    const historico = [];
    for (const cand of candidaturas) {
      const badge = await BadgeRegular.findOne({ where: { idBadgeRegular: cand.idBadgeRegular } });
      const nivel = badge ? await Nivel.findOne({ where: { idNivel: badge.idNivel } }) : null;

      if (ESTADOS_EM_PROCESSO.includes(cand.idEstadoAtual)) {
        badgesEmProgresso.push({
          numCandidatura: cand.numCandidatura,
          nomeBadge: badge?.nomeBadge ?? '-',
          nomeNivel: nivel?.nomeNivel ?? '-',
          nomeEstado: estadosMap[cand.idEstadoAtual] ?? '-',
          dataCriacao: cand.dataCriacao,
        });
      }

      const historicosCand = await HistoricoCandidatura.findAll({ where: { numCandidatura: cand.numCandidatura }, order: [['dataAlteracao', 'ASC']] });
      historicosCand.forEach(h => {
        historico.push({ data: h.dataAlteracao, nomeBadge: badge?.nomeBadge ?? '-', nomeEstado: estadosMap[h.idEstadoAtual] ?? '-', comentario: h.comentario ?? null });
      });
    }
    historico.sort((a, b) => new Date(b.data) - new Date(a.data));

    const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador } });
    const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);

    const evolucao = [
      ...badgesObtidos.map(b => ({ data: b.dataAtribuicao, titulo: `Conquista ${b.nomeBadge}` })),
      ...badgesEspeciais.map(b => ({ data: b.dataAtribuicao, titulo: `Conquista Badge Especial: ${b.nomeBadgeEspecial}` })),
    ].filter(e => e.data).sort((a, b) => new Date(a.data) - new Date(b.data));

    return res.json({
      idUtilizador,
      nome: u?.nomeUtilizador ?? '-',
      email: u?.email ?? '-',
      urlFoto: u?.urlFoto ?? null,
      nomeArea: area?.nomeArea ?? '-',
      nomeServiceLine,
      badgesObtidos, badgesEmProgresso, badgesEspeciais, historico, evolucao, totalPontos,
    });
  } catch (err) {
    console.error('[tm] getConsultorDetalheTM:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar perfil do consultor.' });
  }
};

async function calcularRankingComData(dataLimite) {
  const consultores = await Consultor.findAll();
  const resultado = await Promise.all(consultores.map(async (c) => {
    const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
    const where = { idUtilizador: c.idUtilizador };
    if (dataLimite) where.dataAtribuicao = { [Op.lte]: dataLimite };
    const pontuacoes = await Pontuacao.findAll({ where });
    const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);
    let nomeArea = '-';
    if (c.idArea) { const a = await Area.findOne({ where: { idArea: c.idArea } }); if (a) nomeArea = a.nomeArea; }
    return { idUtilizador: c.idUtilizador, nome: u?.nomeUtilizador ?? '-', nomeArea, totalPontos };
  }));
  resultado.sort((a, b) => b.totalPontos - a.totalPontos);
  resultado.forEach((r, i) => { r.posicao = i + 1; });
  return resultado;
}

// GET /api/tm/gamification/kpis
exports.getGamificationKpis = async (req, res) => {
  try {
    const ranking = await calcularRankingComData(null);
    const melhorPontuacao = ranking.length > 0 ? ranking[0].totalPontos : 0;
    const totalConsultores = ranking.length;

    const hoje = new Date();
    const ha30dias = new Date(hoje); ha30dias.setDate(ha30dias.getDate() - 30);
    const ha60dias = new Date(hoje); ha60dias.setDate(ha60dias.getDate() - 60);

    const rankingAgora = await calcularRankingComData(hoje);
    const rankingHa30 = await calcularRankingComData(ha30dias);

    let somaCrescimento = 0, contagem = 0;
    for (const r of rankingAgora) {
      const anterior = rankingHa30.find(x => x.idUtilizador === r.idUtilizador);
      const pontosAnterior = anterior?.totalPontos ?? 0;
      if (pontosAnterior > 0) {
        somaCrescimento += ((r.totalPontos - pontosAnterior) / pontosAnterior) * 100;
        contagem++;
      }
    }
    const crescimentoMedio = contagem > 0 ? Math.round(somaCrescimento / contagem) : 0;

    const badgesAprovados = await Candidatura.count({ where: { idEstadoAtual: { [Op.in]: [3, 5] } } });

    return res.json({ melhorPontuacao, crescimentoMedio, totalConsultores, badgesAprovados });
  } catch (err) {
    console.error('[tm] getGamificationKpis:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/gamification/ranking
exports.getGamificationRanking = async (req, res) => {
  try {
    const hoje = new Date();
    const ha30dias = new Date(hoje); ha30dias.setDate(ha30dias.getDate() - 30);

    const rankingAgora = await calcularRankingComData(hoje);
    const rankingHa30 = await calcularRankingComData(ha30dias);

    const resultado = rankingAgora.map(r => {
      const anterior = rankingHa30.find(x => x.idUtilizador === r.idUtilizador);
      const evolucao = anterior ? anterior.posicao - r.posicao : 0;
      return { ...r, evolucao };
    });

    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getGamificationRanking:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/gamification/pontos-mensais
exports.getGamificationPontosMensais = async (req, res) => {
  try {
    const inicio = new Date(); inicio.setMonth(inicio.getMonth() - 6);
    const pontuacoes = await Pontuacao.findAll({ where: { dataAtribuicao: { [Op.gte]: inicio } } });

    const meses = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const porMes = {};
    pontuacoes.forEach(p => {
      if (!p.dataAtribuicao) return;
      const chave = meses[new Date(p.dataAtribuicao).getMonth()];
      porMes[chave] = (porMes[chave] || 0) + (p.qtPontos || 0);
    });

    const resultado = [];
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const fimCursor = new Date();
    while (cursor <= fimCursor) {
      const chave = meses[cursor.getMonth()];
      resultado.push({ mes: chave, total: porMes[chave] || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return res.json(resultado);
  } catch (err) {
    console.error('[tm] getGamificationPontosMensais:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/tm/gamification/estatisticas
exports.getGamificationEstatisticas = async (req, res) => {
  try {
    const ranking = await exports.getGamificationRankingInterno();

    const comMovimento = ranking.filter(r => r.evolucao !== 0);
    const maiorSubida = [...comMovimento].sort((a, b) => b.evolucao - a.evolucao).slice(0, 3);
    const maiorDescida = [...comMovimento].sort((a, b) => a.evolucao - b.evolucao).slice(0, 3);
    const consistencia = [...ranking].sort((a, b) => Math.abs(a.evolucao) - Math.abs(b.evolucao)).slice(0, 3);

    const areas = await Area.findAll();
    const totalGeral = ranking.reduce((acc, r) => acc + r.totalPontos, 0);
    const progressoPorArea = areas.map(a => {
      const pontosArea = ranking.filter(r => r.nomeArea === a.nomeArea).reduce((acc, r) => acc + r.totalPontos, 0);
      return { nomeArea: a.nomeArea, percentagem: totalGeral > 0 ? Math.round((pontosArea / totalGeral) * 100) : 0 };
    }).filter(a => a.percentagem > 0).sort((a, b) => b.percentagem - a.percentagem).slice(0, 3);

    return res.json({ maiorSubida, maiorDescida, consistencia, progressoPorArea });
  } catch (err) {
    console.error('[tm] getGamificationEstatisticas:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// Função interna partilhada (evita duplicar a lógica de ranking+evolução)
exports.getGamificationRankingInterno = async () => {
  const hoje = new Date();
  const ha30dias = new Date(hoje); ha30dias.setDate(ha30dias.getDate() - 30);
  const rankingAgora = await calcularRankingComData(hoje);
  const rankingHa30 = await calcularRankingComData(ha30dias);
  return rankingAgora.map(r => {
    const anterior = rankingHa30.find(x => x.idUtilizador === r.idUtilizador);
    const evolucao = anterior ? anterior.posicao - r.posicao : 0;
    return { ...r, evolucao };
  });
};