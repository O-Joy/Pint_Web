const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const Candidatura = sequelize.define('Candidatura', {
  numCandidatura: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'num_candidatura',
  },
  idBadgeRegular: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_badge_regular',
  },
  idCandidato: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_candidato',
  },
  idEstadoAtual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_estado_atual',
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_criacao',
  },
}, {
  tableName: 'candidatura',
  timestamps: false,
});

module.exports = Candidatura;