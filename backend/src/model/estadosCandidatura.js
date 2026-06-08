const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const EstadosCandidatura = sequelize.define('EstadosCandidatura', {
  idEstado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_estado',
  },
  nomeEstado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_estado',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
}, {
  tableName: 'estados_candidatura',
  timestamps: false,
});

module.exports = EstadosCandidatura;