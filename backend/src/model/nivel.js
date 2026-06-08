const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


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