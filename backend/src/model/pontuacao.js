const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Pontuacao = sequelize.define('Pontuacao', {
  idPontuacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_pontuacao',
  },
  idBadgeUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_badge_utilizador',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilizador',
  },
  qtPontos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'qt_pontos',
  },
  dataAtribuicao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_atribuicao',
  },
}, {
  tableName: 'pontuacao',
  timestamps: false,
});

const Utilizador = require('./utilizador');
Pontuacao.belongsTo(Utilizador, { foreignKey: 'id_utilizador' });

module.exports = Pontuacao;