const { Sequelize, Op } = require('sequelize');
const Pontuacao = require('../model/pontuacao');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');

// Função usada pela rota /ranking e também pelo
// dashboardConsultor.controller.js para o objetivo "Atingir Topo Gamification"

// ateData (opcional) — só soma pontos atribuídos até essa data, para
// permitir calcular um ranking "de há X dias" e comparar com o de agora.
async function calcularRanking(ateData) {
  const ranking = await Pontuacao.findAll({
    attributes: [
      'idUtilizador',
      [Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'totalPontos'],
    ],
    where: ateData ? { dataAtribuicao: { [Op.lte]: ateData } } : undefined,
    group: ['Pontuacao.id_utilizador', 'Utilizador.id_utilizador', 'Utilizador.nome_utilizador', 'Utilizador.url_foto'],
    order: [[Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'DESC']],
    include: [
      {
        model: Utilizador,
        attributes: ['nomeUtilizador', 'urlFoto'],
      },
    ],
    raw: false,
  });

  return ranking.map((r, index) => ({
    posicao: index + 1,
    idUtilizador: r.idUtilizador,
    nome: r.Utilizador?.nomeUtilizador ?? 'Sem nome',
    urlFoto: r.Utilizador?.urlFoto ?? null,
    totalPontos: parseInt(r.dataValues.totalPontos) || 0,
  }));
}

exports.calcularRanking = calcularRanking;

// GET /api/ranking
// Ranking completo com evolução real nos ultimos 7 dias (para mostrar progresso)
exports.getRanking = async (req, res) => {
  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [rankingAtual, rankingAnterior] = await Promise.all([
      calcularRanking(),
      calcularRanking(seteDiasAtras),
    ]);

    const resultado = rankingAtual.map((r) => {
      const antes = rankingAnterior.find((a) => a.idUtilizador === r.idUtilizador);
      return {
        ...r,
        evolucao: antes ? antes.posicao - r.posicao : null, // null = ainda não tinha pontos há 7 dias
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error('Erro no ranking:', err);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  }
};