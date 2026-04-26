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

const ServiceLine = sequelize.define('ServiceLine', {
  idServiceLine: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_service_line',
  },
  idLearningPath: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_learning_path',
  },
  nomeSl: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_sl',
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
  tableName: 'service_line',
  timestamps: false,
});

module.exports = ServiceLine;