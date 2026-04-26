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

const RegistoSla = sequelize.define('RegistoSla', {
  idSlaRegisto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_sla_registo',
  },
  idSla: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_sla',
  },
  numCandidatura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'num_candidatura',
  },
  idTransacao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_transacao',
  },
  dataAlteracao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_alteracao',
  },
  dataLimite: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_limite',
  },
  prazoUltrapassado: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    field: 'prazo_ultrapassado',
  },
}, {
  tableName: 'registo_sla',
  timestamps: false,
});

module.exports = RegistoSla;