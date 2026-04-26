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

const UtilizadorNotificacao = sequelize.define('UtilizadorNotificacao', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idNotificacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_notificacao',
  },
}, {
  tableName: 'utilizador_notificacao',
  timestamps: false,
});

module.exports = UtilizadorNotificacao;