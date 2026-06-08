const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const Objetivo = sequelize.define('Objetivo', {
  idObjetivo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_objetivo',
  },
  idLearningPath: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_learning_path',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilizador',
  },
  idTipoObjetivo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_tipo_objetivo',
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_inicio',
  },
  dataFim: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_fim',
  },
  dataConclusao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_conclusao',
  },
  alcancado: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'alcancado',
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'estado',
  },
}, {
  tableName: 'objetivo',
  timestamps: false,
});

module.exports = Objetivo;