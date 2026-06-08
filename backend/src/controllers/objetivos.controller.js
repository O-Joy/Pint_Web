const Objetivo = require('../model/objetivo');
const TipoObjetivo = require('../model/tipoObjetivo');
const LearningPath = require('../model/learningPath');

// GET /api/objetivos
// Lista todos os objetivos do consultor autenticado
exports.getObjetivos = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    const objetivos = await Objetivo.findAll({
      where: { idUtilizador },
      order: [['dataFim', 'ASC']],
    });

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        const lp = obj.idLearningPath
          ? await LearningPath.findOne({ where: { idLearningPath: obj.idLearningPath } })
          : null;

        return {
          id: obj.idObjetivo,
          nomeTipo: tipo?.nome ?? null,
          descricaoTipo: tipo?.descricao ?? null,
          nomeLearningPath: lp?.nomeLp ?? null,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          dataConclusao: obj.dataConclusao,
          alcancado: obj.alcancado,
          estado: obj.estado,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[objetivos] getObjetivos:', err);
    res.status(500).json({ error: 'Erro ao carregar objetivos.' });
  }
};

// GET /api/objetivos/em-curso
// Apenas os objetivos em curso
exports.getObjetivosEmCurso = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    const objetivos = await Objetivo.findAll({
      where: { idUtilizador, estado: 'Em Curso' },
      order: [['dataFim', 'ASC']],
    });

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        const lp = obj.idLearningPath
          ? await LearningPath.findOne({ where: { idLearningPath: obj.idLearningPath } })
          : null;

        const total = new Date(obj.dataFim) - new Date(obj.dataInicio);
        const decorrido = new Date() - new Date(obj.dataInicio);
        const progresso = Math.min(Math.round((decorrido / total) * 100), 100);

        return {
          id: obj.idObjetivo,
          nomeTipo: tipo?.nome ?? null,
          descricaoTipo: tipo?.descricao ?? null,
          nomeLearningPath: lp?.nomeLp ?? null,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          progresso,
          alcancado: obj.alcancado,
          estado: obj.estado,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[objetivos] getObjetivosEmCurso:', err);
    res.status(500).json({ error: 'Erro ao carregar objetivos em curso.' });
  }
};

// GET /api/objetivos/concluidos
// Apenas os objetivos concluídos
exports.getObjetivosConcluidos = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    const objetivos = await Objetivo.findAll({
      where: { idUtilizador, estado: 'Concluido' },
      order: [['dataConclusao', 'DESC']],
    });

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        const lp = obj.idLearningPath
          ? await LearningPath.findOne({ where: { idLearningPath: obj.idLearningPath } })
          : null;

        return {
          id: obj.idObjetivo,
          nomeTipo: tipo?.nome ?? null,
          nomeLearningPath: lp?.nomeLp ?? null,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          dataConclusao: obj.dataConclusao,
          alcancado: obj.alcancado,
          estado: obj.estado,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[objetivos] getObjetivosConcluidos:', err);
    res.status(500).json({ error: 'Erro ao carregar objetivos concluídos.' });
  }
};