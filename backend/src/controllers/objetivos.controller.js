const Objetivo = require('../model/objetivo');
const TipoObjetivo = require('../model/tipoObjetivo');
const LearningPath = require('../model/learningPath');
const Consultor = require('../model/consultor');
const { calcularRanking } = require('./gamification.controller');
const {
  TIPO_ATINGIR_TOPO_GAMIFICATION,
  construirContexto,
  calcularProgresso,
} = require('../utils/progressoObjetivo');

// verifica se algum objetivo "Em Curso" já passou da data limite sem ser alcançado, e marca-o como "Não Alcançado"
async function expirarObjetivosVencidos(idUtilizador) {
  await Objetivo.update(
    { estado: 'Não Alcançado' },
    {
      where: {
        idUtilizador,
        estado: 'Em Curso',
        dataFim: { [require('sequelize').Op.lt]: new Date() },
      },
    }
  );
}

// GET /api/objetivos/tipos
// Lista os 5 tipos de objetivo definidos na BD, para os cartões "Crie um novo objetivo"
exports.getTipos = async (req, res) => {
  try {
    const tipos = await TipoObjetivo.findAll({ order: [['idTipoObjetivo', 'ASC']] });
    res.json(tipos.map(t => ({ id: t.idTipoObjetivo, nome: t.nome, descricao: t.descricao })));
  } catch (err) {
    console.error('[objetivos] getTipos:', err);
    res.status(500).json({ error: 'Erro ao carregar tipos de objetivo.' });
  }
};

// GET /api/objetivos
// Lista todos os objetivos do consultor autenticado com progresso
exports.getObjetivos = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    await expirarObjetivosVencidos(idUtilizador);

    const objetivos = await Objetivo.findAll({
      where: { idUtilizador },
      order: [['dataFim', 'ASC']],
    });

    const contexto = await construirContexto(idUtilizador);
    const precisaRanking = objetivos.some(o => o.idTipoObjetivo === TIPO_ATINGIR_TOPO_GAMIFICATION);
    const rankingGeral = precisaRanking ? await calcularRanking() : null;

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        const progresso = await calcularProgresso(obj, contexto, rankingGeral);

        return {
          id: obj.idObjetivo,
          idTipoObjetivo: obj.idTipoObjetivo,
          nomeTipo: tipo?.nome ?? null,
          descricaoTipo: tipo?.descricao ?? null,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          dataConclusao: obj.dataConclusao,
          alcancado: obj.alcancado,
          estado: obj.estado,
          ...progresso,
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
// Apenas os objetivos em curso - marca como "Concluido" automaticamente quem já atingiu a meta
exports.getObjetivosEmCurso = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    await expirarObjetivosVencidos(idUtilizador);

    const objetivos = await Objetivo.findAll({
      where: { idUtilizador, estado: 'Em Curso' },
      order: [['dataFim', 'ASC']],
    });

    const contexto = await construirContexto(idUtilizador);
    const precisaRanking = objetivos.some(o => o.idTipoObjetivo === TIPO_ATINGIR_TOPO_GAMIFICATION);
    const rankingGeral = precisaRanking ? await calcularRanking() : null;

    const resultado = [];
    for (const obj of objetivos) {
      const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
      const progresso = await calcularProgresso(obj, contexto, rankingGeral);

      // Auto-conclui quem já atingiu a meta
      if (progresso.concluido) {
        await obj.update({ estado: 'Concluido', alcancado: 1, dataConclusao: new Date() });
        continue; // já não entra na lista de "em curso"
      }

      resultado.push({
        id: obj.idObjetivo,
        idTipoObjetivo: obj.idTipoObjetivo,
        nomeTipo: tipo?.nome ?? null,
        descricaoTipo: tipo?.descricao ?? null,
        dataInicio: obj.dataInicio,
        dataFim: obj.dataFim,
        atual: progresso.atual,
        meta: progresso.meta,
        percentagem: progresso.percentagem,
        formato: progresso.formato,
      });
    }

    res.json(resultado);
  } catch (err) {
    console.error('[objetivos] getObjetivosEmCurso:', err);
    res.status(500).json({ error: 'Erro ao carregar objetivos em curso.' });
  }
};

// GET /api/objetivos/historico
// Objetivos que já saíram de "Em Curso" — Concluido / Não Alcançado / Eliminado
exports.getHistorico = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  try {
    await expirarObjetivosVencidos(idUtilizador);

    const objetivos = await Objetivo.findAll({
      where: { idUtilizador, estado: { [require('sequelize').Op.ne]: 'Em Curso' } },
      order: [['dataFim', 'DESC']],
    });

    const resultado = await Promise.all(
      objetivos.map(async (obj) => {
        const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo: obj.idTipoObjetivo } });
        return {
          id: obj.idObjetivo,
          nomeTipo: tipo?.nome ?? null,
          dataInicio: obj.dataInicio,
          dataFim: obj.dataFim,
          dataConclusao: obj.dataConclusao,
          resultado: obj.estado, // Concluido/Não Alcançado/Eliminado
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('[objetivos] getHistorico:', err);
    res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
};

// POST /api/objetivos
// Cria um novo objetivo a partir de um dos 5 tipos definidos na BD.
// Body: { idTipoObjetivo, dataFim }
exports.criarObjetivo = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const { idTipoObjetivo, dataFim } = req.body;

  if (!idTipoObjetivo || !dataFim) {
    return res.status(400).json({ error: 'idTipoObjetivo e dataFim são obrigatórios.' });
  }

  try {
    const tipo = await TipoObjetivo.findOne({ where: { idTipoObjetivo } });
    if (!tipo) {
      return res.status(400).json({ error: 'Tipo de objetivo inválido.' });
    }

    if (new Date(dataFim) <= new Date()) {
      return res.status(400).json({ error: 'A data limite tem de ser no futuro.' });
    }

    // Não deixa criar um segundo objetivo do mesmo tipo já em curso
    const jaExiste = await Objetivo.findOne({
      where: { idUtilizador, idTipoObjetivo, estado: 'Em Curso' },
    });
    if (jaExiste) {
      return res.status(409).json({ error: 'Já tens um objetivo deste tipo em curso.' });
    }

    const consultor = await Consultor.findOne({ where: { idUtilizador } });

    const novo = await Objetivo.create({
      idUtilizador,
      idTipoObjetivo,
      idLearningPath: consultor?.idLearningPath ?? null,
      dataInicio: new Date(),
      dataFim,
      dataConclusao: null,
      alcancado: 0,
      estado: 'Em Curso',
    });

    res.status(201).json({ id: novo.idObjetivo, nomeTipo: tipo.nome });
  } catch (err) {
    console.error('[objetivos] criarObjetivo:', err);
    res.status(500).json({ error: 'Erro ao criar objetivo.' });
  }
};

// PUT /api/objetivos/:id
// Só permite alterar a data limite de um objetivo próprio, ainda em curso.
// Body: { dataFim }
exports.editarObjetivo = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const { id } = req.params;
  const { dataFim } = req.body;

  if (!dataFim) {
    return res.status(400).json({ error: 'dataFim é obrigatória.' });
  }
  if (new Date(dataFim) <= new Date()) {
    return res.status(400).json({ error: 'A data limite tem de ser no futuro.' });
  }

  try {
    const objetivo = await Objetivo.findOne({ where: { idObjetivo: id, idUtilizador } });
    if (!objetivo) {
      return res.status(404).json({ error: 'Objetivo não encontrado.' });
    }
    if (objetivo.estado !== 'Em Curso') {
      return res.status(400).json({ error: 'Só é possível editar objetivos em curso.' });
    }

    await objetivo.update({ dataFim });
    res.json({ id: objetivo.idObjetivo, dataFim: objetivo.dataFim });
  } catch (err) {
    console.error('[objetivos] editarObjetivo:', err);
    res.status(500).json({ error: 'Erro ao editar objetivo.' });
  }
};

// DELETE /api/objetivos/:id
// Não apaga a linha — marca estado='Eliminado' para continuar visível no Histórico.
exports.removerObjetivo = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const { id } = req.params;

  try {
    const objetivo = await Objetivo.findOne({ where: { idObjetivo: id, idUtilizador } });
    if (!objetivo) {
      return res.status(404).json({ error: 'Objetivo não encontrado.' });
    }
    if (objetivo.estado !== 'Em Curso') {
      return res.status(400).json({ error: 'Só é possível remover objetivos em curso.' });
    }

    await objetivo.update({ estado: 'Eliminado' });
    res.json({ id: objetivo.idObjetivo, estado: 'Eliminado' });
  } catch (err) {
    console.error('[objetivos] removerObjetivo:', err);
    res.status(500).json({ error: 'Erro ao remover objetivo.' });
  }
};