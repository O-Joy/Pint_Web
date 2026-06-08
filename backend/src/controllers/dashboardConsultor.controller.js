const { Op } = require('sequelize');
const Candidatura = require('../model/candidatura');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Objetivo = require('../model/objetivo');
const TipoObjetivo = require('../model/tipoObjetivo');
const LearningPath = require('../model/learningPath');

// Estados "a decorrer" — excluindo Aprovada(5) e Rejeitada(6)
const ESTADOS_EM_CURSO = [1, 2, 3, 4];

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/resumo
// 4 cards de resumo do consultor autenticado
// ─────────────────────────────────────────────────────────────
exports.getResumo = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    // Pedidos a decorrer (estados 1,2,3,4)
    const pedidosEmCurso = await Candidatura.count({
      where: {
        idCandidato: idUtilizador,
        idEstadoAtual: { [Op.in]: ESTADOS_EM_CURSO },
      },
    });

    // Todos os badges do utilizador
    const todosBadges = await BadgeUtilizador.findAll({
      where: { idUtilizador },
    });

    const badgesConquistados = todosBadges.filter(b => b.idBadgeRegular).length;
    const badgesEspeciais = todosBadges.filter(b => b.idBadgeEspecial).length;

    // Objetivos alcançados
    const objetivosAlcancados = await Objetivo.count({
      where: { idUtilizador, alcancado: 1 },
    });

    res.json({
      pedidosEmCurso,
      badgesConquistados,
      badgesEspeciais,
      objetivosAlcancados,
    });
  } catch (err) {
    console.error('[dashboard/resumo]', err);
    res.status(500).json({ error: 'Erro ao carregar resumo.' });
  }
};

// ====================================================
// GET /api/dashboard/objetivos

exports.getObjetivos = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    const objetivos = await Objetivo.findAll({
      where: { idUtilizador, estado: 'Em Curso' },
      order: [['dataFim', 'ASC']],
    });

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        let nomeTipo = null;
        let nomeLearningPath = null;

        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        if (tipo) nomeTipo = tipo.nome;

        if (obj.idLearningPath) {
          const lp = await LearningPath.findOne({ where: { idLearningPath: obj.idLearningPath } });
          if (lp) nomeLearningPath = lp.nomeLp;
        }

        return {
          id: obj.idObjetivo,
          nomeTipo,
          nomeLearningPath,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          alcancado: obj.alcancado,
          estado: obj.estado,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[dashboard/objetivos]', err);
    res.status(500).json({ error: 'Erro ao carregar objetivos.' });
  }
};