const { Sequelize } = require('sequelize');
const Pontuacao = require('../model/pontuacao');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');

// Função reutilizável — usada pela rota /ranking e também pelo
// dashboardConsultor.controller.js (objetivo "Atingir Topo Gamification")
async function calcularRanking() {
  const ranking = await Pontuacao.findAll({
    attributes: [
      'idUtilizador',
      [Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'totalPontos'],
    ],
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

exports.getRanking = async (req, res) => {
  try {
    const resultado = await calcularRanking();
    res.json(resultado);
  } catch (err) {
    console.error('Erro no ranking:', err);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  }
};