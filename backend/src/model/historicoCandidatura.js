const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const HistoricoCandidatura = sequelize.define('HistoricoCandidatura', {
  idTransacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_transacao',
  },
  numCandidatura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'num_candidatura',
  },
  idResponsavel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_responsavel',
  },
  tipoResponsavel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'tipo_responsavel',
  },
  dataAlteracao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_alteracao',
  },
  idEstadoAtual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_estado_atual',
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comentario',
  },
}, {
  tableName: 'historico_candidatura',
  timestamps: false,
});

module.exports = HistoricoCandidatura;