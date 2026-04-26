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

const EstadosCandidatura = sequelize.define('EstadosCandidatura', {
  idEstado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_estado',
  },
  nomeEstado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_estado',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
}, {
  tableName: 'estados_candidatura',
  timestamps: false,
});

module.exports = EstadosCandidatura;