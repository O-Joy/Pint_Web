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

const Area = sequelize.define('Area', {
  idArea: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_area',
  },
  idServiceLine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_service_line',
  },
  nomeArea: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_area',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
  ativo: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    field: 'ativo',
  },
}, {
  tableName: 'area',
  timestamps: false,
});

module.exports = Area;