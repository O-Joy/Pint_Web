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

const Notificacao = sequelize.define('Notificacao', {
  idNotificacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_notificacao',
  },
  idObjetivo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_objetivo',
  },
  idSlaRegisto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_sla_registo',
  },
  numCandidatura: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'num_candidatura',
  },
  idTransacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_transacao',
  },
  idBadgeEspecial: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_badge_especial',
  },
  idBadgeUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_badge_utilizador',
  },
  tipoNotificacao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tipo_notificacao',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
  data: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data',
  },
}, {
  tableName: 'notificacao',
  timestamps: false,
});

module.exports = Notificacao;