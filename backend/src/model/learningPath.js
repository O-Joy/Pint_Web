const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const LearningPath = sequelize.define('LearningPath', {
  idLearningPath: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_learning_path',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_utilizador',
  },
  nomeLp: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_lp',
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
  tableName: 'learning_path',
  timestamps: false,
});

module.exports = LearningPath;