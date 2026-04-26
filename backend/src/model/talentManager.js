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

const TalentManager = sequelize.define('TalentManager', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idArea: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_area',
  },
  idServiceLine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_service_line',
  },
}, {
  tableName: 'talent_manager',
  timestamps: false,
});

module.exports = TalentManager;