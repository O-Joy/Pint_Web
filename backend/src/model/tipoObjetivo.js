const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const TipoObjetivo = sequelize.define('TipoObjetivo', {
  idTipoObjetivo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_tipo_objetivo',
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
}, {
  tableName: 'tipo_objetivo',
  timestamps: false,
});

module.exports = TipoObjetivo;