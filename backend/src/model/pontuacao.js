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

const Pontuacao = sequelize.define('Pontuacao', {
  idPontuacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_pontuacao',
  },
  idBadgeUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_badge_utilizador',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilizador',
  },
  qtPontos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'qt_pontos',
  },
  dataAtribuicao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_atribuicao',
  },
}, {
  tableName: 'pontuacao',
  timestamps: false,
});

module.exports = Pontuacao;