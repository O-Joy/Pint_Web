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

const SlLeader = sequelize.define('SlLeader', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idServiceLine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_service_line',
  },
}, {
  tableName: 'sl_leader',
  timestamps: false,
});

module.exports = SlLeader;