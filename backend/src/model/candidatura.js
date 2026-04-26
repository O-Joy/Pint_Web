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

const Candidatura = sequelize.define('Candidatura', {
  numCandidatura: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'num_candidatura',
  },
  idBadgeRegular: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_badge_regular',
  },
  idCandidato: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_candidato',
  },
  idEstadoAtual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_estado_atual',
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_criacao',
  },
}, {
  tableName: 'candidatura',
  timestamps: false,
});

module.exports = Candidatura;