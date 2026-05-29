const { Sequelize } = require('sequelize');
const Pontuacao = require('../model/pontuacao');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');

exports.getRanking = async (req, res) => {
  try {
    // Soma os pontos de cada consultor agrupados por utilizador
    const ranking = await Pontuacao.findAll({
      attributes: [
        'idUtilizador',
        [Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'totalPontos'],
      ],
      group: ['Pontuacao.id_utilizador', 'utilizador.id_utilizador'],
      order: [[Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'DESC']],
      include: [
        {
          model: Utilizador,
          attributes: ['nomeUtilizador', 'urlFoto'],
        },
      ],
      raw: false,
    });

    const resultado = ranking.map((r, index) => ({
      posicao: index + 1,
      idUtilizador: r.idUtilizador,
      nome: r.Utilizador?.nomeUtilizador ?? 'Sem nome',
      urlFoto: r.Utilizador?.urlFoto ?? null,
      totalPontos: parseInt(r.dataValues.totalPontos) || 0,
    }));

    res.json(resultado);
  } catch (err) {
    console.error('Erro no ranking:', err);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  }
};