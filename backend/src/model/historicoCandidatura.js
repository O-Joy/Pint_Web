const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

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