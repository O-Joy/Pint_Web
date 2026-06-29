const { Op } = require('sequelize');
const crypto = require('crypto');

const Utilizador = require('../model/utilizador');
const Consultor = require('../model/consultor');
const BadgeUtilizador = require('../model/badgeUtilizador');
const Pontuacao = require('../model/pontuacao');

exports.getRankingGlobal = async (req, res) => {
  try {
    // Vai buscar TODOS os consultores sem filtrar por área ou Service Line
    const consultores = await Consultor.findAll();

    const resultado = await Promise.all(consultores.map(async (c) => {
      const u = await Utilizador.findOne({ where: { idUtilizador: c.idUtilizador } });
      const totalBadges = await BadgeUtilizador.count({ where: { idUtilizador: c.idUtilizador } });
      
      const pontuacoes = await Pontuacao.findAll({ where: { idUtilizador: c.idUtilizador } });
      const totalPontos = pontuacoes.reduce((acc, p) => acc + (p.qtPontos || 0), 0);
      
      return { 
        idUtilizador: c.idUtilizador, 
        nome: u?.nomeUtilizador ?? '-', 
        totalBadges, 
        totalPontos 
      };
    }));

    // Ordenar do maior para o menor
    resultado.sort((a, b) => b.totalPontos - a.totalPontos);
    return res.json(resultado);
  } catch (err) {
    console.error('[gamification] getRankingGlobal:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar ranking global.' });
  }
};