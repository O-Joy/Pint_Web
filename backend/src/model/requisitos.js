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

const Requisitos = sequelize.define('Requisitos', {
  idRequisito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_requisito',
  },
  idBadgeRegular: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_badge_regular',
  },
  nomeRequisito: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nome_requisito',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
}, {
  tableName: 'requisitos',
  timestamps: false,
});

module.exports = Requisitos;