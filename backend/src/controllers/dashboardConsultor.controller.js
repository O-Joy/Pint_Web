const { Op, Sequelize } = require('sequelize');
const Candidatura = require('../model/candidatura');
const BadgeUtilizador = require('../model/badgeUtilizador');
const BadgeRegular = require('../model/badgeRegular');
const BadgeEspecial = require('../model/badgeEspecial');
const Objetivo = require('../model/objetivo');
const TipoObjetivo = require('../model/tipoObjetivo');
const LearningPath = require('../model/learningPath');
const Consultor = require('../model/consultor');
const Area = require('../model/area');
const Nivel = require('../model/nivel');
const Requisitos = require('../model/requisitos');
const { calcularRanking } = require('./gamification.controller');
const {
  TIPO_COMPLETAR_LEARNING_PATH,
  TIPO_ATINGIR_TOPO_GAMIFICATION,
  construirContexto,
  calcularProgresso,
} = require('../utils/progressoObjetivo');

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

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/objetivos-resumo
// Card "Objetivos" do dashboard: % de progresso na Learning Path
// + até 2 objetivos em curso, com progresso real calculado consoante
// o tipo de objetivo (tabela tipo_objetivo tem 5 tipos definidos):
//   1. Completar Área
//   2. Completar Service Line
//   3. Completar Learning Path
//   4. Atingir Nível Líder
//   5. Atingir Topo Gamification
// ─────────────────────────────────────────────────────────────
exports.getObjetivosResumo = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    const contexto = await construirContexto(idUtilizador);
    const { idLearningPathConsultor, badgesRegularesGanhos, idsBadgeEspecialGanhos } = contexto;

    // ── % de progresso na Learning Path (gráfico circular) ──
    // Usa o objetivo "Completar Learning Path" em curso, se existir;
    // senão cai para a Learning Path do próprio consultor.
    const objetivoLP = await Objetivo.findOne({
      where: { idUtilizador, idTipoObjetivo: TIPO_COMPLETAR_LEARNING_PATH, estado: 'Em Curso' },
    });
    const idLearningPathAlvo = objetivoLP?.idLearningPath ?? idLearningPathConsultor;

    let progressoLearningPath = 0;
    if (idLearningPathAlvo) {
      const totalRegularesLP = await BadgeRegular.count({ where: { idLearningPath: idLearningPathAlvo, ativo: 1 } });
      const totalEspeciaisLP = await BadgeEspecial.count({ where: { idLearningPath: idLearningPathAlvo, ativo: 1 } });
      const metaLP = totalRegularesLP + totalEspeciaisLP;

      const ganhosRegularesLP = badgesRegularesGanhos.filter(b => b.idLearningPath === idLearningPathAlvo).length;
      const ganhosEspeciaisLP = idsBadgeEspecialGanhos.length
        ? await BadgeEspecial.count({ where: { idBadgeEspecial: { [Op.in]: idsBadgeEspecialGanhos }, idLearningPath: idLearningPathAlvo } })
        : 0;
      const atualLP = ganhosRegularesLP + ganhosEspeciaisLP;

      progressoLearningPath = metaLP > 0 ? Math.round((atualLP / metaLP) * 100) : 0;
    }

    // "X Áreas Completas" / "Y Service Lines Concluídas"
    const todasAreas = await Area.findAll({ where: { ativo: 1 } });
    let areasCompletas = 0;
    for (const area of todasAreas) {
      const totalArea = await BadgeRegular.count({ where: { idArea: area.idArea, ativo: 1 } });
      const ganhosArea = badgesRegularesGanhos.filter(b => b.idArea === area.idArea).length;
      if (totalArea > 0 && ganhosArea >= totalArea) areasCompletas++;
    }

    const idsServiceLine = [...new Set(todasAreas.map(a => a.idServiceLine))];
    let serviceLinesConcluidas = 0;
    for (const idSL of idsServiceLine) {
      const totalSL = await BadgeRegular.count({ where: { idServiceLine: idSL, ativo: 1 } });
      const ganhosSL = badgesRegularesGanhos.filter(b => b.idServiceLine === idSL).length;
      if (totalSL > 0 && ganhosSL >= totalSL) serviceLinesConcluidas++;
    }

    //Objetivos em curso (max 2 cads)
    const objetivosEmCurso = await Objetivo.findAll({
      where: { idUtilizador, estado: 'Em Curso' },
      order: [['dataFim', 'ASC']],
      limit: 2,
    });

    // Ranking geral — só é calculado se houver algum objetivo do tipo 5
    const precisaRanking = objetivosEmCurso.some(o => o.idTipoObjetivo === TIPO_ATINGIR_TOPO_GAMIFICATION);
    const rankingGeral = precisaRanking ? await calcularRanking() : null;

    const objetivosEmProgresso = await Promise.all(
      objetivosEmCurso.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        const titulo = tipo?.nome ?? 'Objetivo';
        const progresso = await calcularProgresso(obj, contexto, rankingGeral);

        return {
          id: obj.idObjetivo,
          titulo,
          formato: progresso.formato,
          atual: progresso.atual,
          meta: progresso.meta,
          percentagem: progresso.percentagem,
          dataFim: obj.dataFim,
        };
      })
    );

    res.json({
      progressoLearningPath,
      areasCompletas,
      serviceLinesConcluidas,
      objetivosEmProgresso,
    });
  } catch (err) {
    console.error('[dashboard/objetivos-resumo]', err);
    res.status(500).json({ error: 'Erro ao carregar resumo de objetivos.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/badges-recomendados
// Até 4 badges regulares que o consultor ainda não tem,
// priorizando a área do consultor
// ─────────────────────────────────────────────────────────────
exports.getBadgesRecomendados = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    const consultor = await Consultor.findOne({ where: { idUtilizador } });
    const idAreaConsultor = consultor?.idArea ?? null;

    const badgesGanhos = await BadgeUtilizador.findAll({
      where: { idUtilizador, idBadgeRegular: { [Op.ne]: null } },
    });
    const idsGanhos = badgesGanhos.map(b => b.idBadgeRegular);

    const disponiveis = await BadgeRegular.findAll({
      where: {
        ativo: 1,
        ...(idsGanhos.length ? { idBadgeRegular: { [Op.notIn]: idsGanhos } } : {}),
      },
      order: [['nomeBadge', 'ASC']],
    });

    // Prioriza badges da área do consultor, depois as restantes
    const ordenados = idAreaConsultor
      ? [
          ...disponiveis.filter(b => b.idArea === idAreaConsultor),
          ...disponiveis.filter(b => b.idArea !== idAreaConsultor),
        ]
      : disponiveis;

    const top4 = ordenados.slice(0, 4);

    const resultado = await Promise.all(
      top4.map(async (b) => {
        const nivel = b.idNivel ? await Nivel.findOne({ where: { idNivel: b.idNivel } }) : null;
        const numRequisitos = await Requisitos.count({ where: { idBadgeRegular: b.idBadgeRegular } });

        return {
          id: b.idBadgeRegular,
          nome: b.nomeBadge,
          nomeNivel: nivel?.nomeNivel ?? null,
          urlImagem: b.urlImagemBadge,
          numRequisitos,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[dashboard/badges-recomendados]', err);
    res.status(500).json({ error: 'Erro ao carregar badges recomendados.' });
  }
};