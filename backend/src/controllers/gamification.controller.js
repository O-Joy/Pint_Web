const { Sequelize, Op } = require('sequelize');
const Pontuacao = require('../model/pontuacao');
const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');

exports.getRanking = async (req, res) => {
  try {
    // Soma os pontos de cada consultor agrupados por utilizador (ranking atual)
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

    // Mesma soma, mas só com pontos já atribuídos há 7+ dias — dá o ranking "de há uma semana"
    //Para implementação da evolução dos consultores no ranking (subiu/desceu/manteve)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const rankingHaSeteDias = await Pontuacao.findAll({
      attributes: [
        'idUtilizador',
        [Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'totalPontos'],
      ],
      where: { dataAtribuicao: { [Op.lte]: seteDiasAtras } },
      group: ['id_utilizador'],
      order: [[Sequelize.fn('SUM', Sequelize.col('qt_pontos')), 'DESC']],
      raw: true,
    });

    // Mapa idUtilizador -> posição de há 7 dias
    const posicaoAntigaPorUtilizador = {};
    rankingHaSeteDias.forEach((r, index) => {
      posicaoAntigaPorUtilizador[r.idUtilizador] = index + 1;
    });
    // Quem não tinha pontos há 7 dias entra como se estivesse logo a seguir ao último dessa altura
    const posicaoSemDadosAntigos = rankingHaSeteDias.length + 1;

    const resultado = ranking.map((r, index) => {
      const posicaoAtual = index + 1;
      const posicaoAntiga = posicaoAntigaPorUtilizador[r.idUtilizador] ?? posicaoSemDadosAntigos;
      // positivo = subiu no ranking (estava mais atrás há 7 dias); negativo = desceu
      const evolucao = posicaoAntiga - posicaoAtual;

      return {
        posicao: posicaoAtual,
        idUtilizador: r.idUtilizador,
        nome: r.Utilizador?.nomeUtilizador ?? 'Sem nome',
        urlFoto: r.Utilizador?.urlFoto ?? null,
        totalPontos: parseInt(r.dataValues.totalPontos) || 0,
        evolucao,
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error('Erro no ranking:', err);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  }
};