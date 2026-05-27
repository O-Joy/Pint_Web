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