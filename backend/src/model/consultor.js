const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');


const Consultor = sequelize.define('Consultor', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'id_utilizador',
  },
  idLearningPath: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_learning_path',
  },
  idArea: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_area',
  },
}, {
  tableName: 'consultor',
  timestamps: false,
});

module.exports = Consultor;