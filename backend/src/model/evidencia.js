const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const Evidencia = sequelize.define('Evidencia', {
  idEvidencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_evidencia',
  },
  numCandidatura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'num_candidatura',
  },
  idRequisito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_requisito',
  },
  idResponsavel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_responsavel',
  },
  pathFicheiro: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'path_ficheiro',
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'estado',
  },
}, {
  tableName: 'evidencia',
  timestamps: false,
});

module.exports = Evidencia;