const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


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