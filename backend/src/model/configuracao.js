const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Configuracao = sequelize.define('Configuracao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id',
  },
  chave: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'chave',
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'conteudo',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_utilizador',
  },
  dataAlteracao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'data_alteracao',
  },
}, {
  tableName: 'configuracoes',
  timestamps: false,
});

module.exports = Configuracao;
