const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const SlLeader = sequelize.define('SlLeader', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idServiceLine: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_service_line',
  },
}, {
  tableName: 'sl_leader',
  timestamps: false,
});

module.exports = SlLeader;