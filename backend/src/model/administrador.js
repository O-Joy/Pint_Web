const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const Administrador = sequelize.define('Administrador', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
}, {
  tableName: 'administrador',
  timestamps: false,
});

module.exports = Administrador;