const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
 
 
const UtilizadorNotificacao = sequelize.define('UtilizadorNotificacao', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idNotificacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_notificacao',
  },
  lida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'lida',
  },
}, {
  tableName: 'utilizador_notificacao',
  timestamps: false,
});
 
module.exports = UtilizadorNotificacao;