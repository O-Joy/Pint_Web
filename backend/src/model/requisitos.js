const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


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