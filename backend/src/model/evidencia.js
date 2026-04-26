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

const Evidencia = sequelize.define('Evidencia', {
  idEvidencia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_evidencia',
  },
  numCandidatura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'num_candidatura',
  },
  idRequisito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_requisito',
  },
  idResponsavel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_responsavel',
  },
  pathFicheiro: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'path_ficheiro',
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'estado',
  },
}, {
  tableName: 'evidencia',
  timestamps: false,
});

module.exports = Evidencia;