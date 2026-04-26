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

const Nivel = sequelize.define('Nivel', {
  idNivel: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_nivel',
  },
  idArea: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_area',
  },
  nomeNivel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nome_nivel',
  },
  tipo: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'tipo',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
}, {
  tableName: 'nivel',
  timestamps: false,
});

module.exports = Nivel;