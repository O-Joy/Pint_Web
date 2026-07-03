const Candidatura = require('../model/candidatura');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const BadgeRegular = require('../model/badgeRegular');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Pontuacao = require('../model/pontuacao');
const Nivel = require('../model/nivel');
const Area = require('../model/area');
const { Op } = require('sequelize');

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