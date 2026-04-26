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

const Administrador = sequelize.define('Administrador', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
}, {
  tableName: 'administrador',
  timestamps: false,
});

module.exports = Administrador;