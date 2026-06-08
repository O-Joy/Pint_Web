const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
 
 
const Sla = sequelize.define('Sla', {
  idSla: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_sla',
  },
  tipoAcao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tipo_acao',
  },
  tipoPerfil: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tipo_perfil',
  },
  horasMaxAcao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'horas_max_acao',
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacoes',
  },
}, {
  tableName: 'sla',
  timestamps: false,
});
 
module.exports = Sla;