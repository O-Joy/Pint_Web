const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const Objetivo = sequelize.define('Objetivo', {
  idObjetivo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_objetivo',
  },
  idLearningPath: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_learning_path',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilizador',
  },
  idTipoObjetivo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_tipo_objetivo',
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_inicio',
  },
  dataFim: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_fim',
  },
  dataConclusao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_conclusao',
  },
  alcancado: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'alcancado',
  },
  estado: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'estado',
  },
}, {
  tableName: 'objetivo',
  timestamps: false,
});

module.exports = Objetivo;