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

const BadgeUtilizador = sequelize.define('BadgeUtilizador', {
  idBadgeUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_badge_utilizador',
  },
  idBadgeEspecial: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_badge_especial',
  },
  idBadgeRegular: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_badge_regular',
  },
  idUtilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_utilizador',
  },
  dataAtribuicao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_atribuicao',
  },
  dataExpiracao: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_expiracao',
  },
  valido: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'valido',
  },
  urlPublico: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'url_publico',
  },
  tokenValidacao: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'token_validacao',
  },
}, {
  tableName: 'badge_utilizador',
  timestamps: false,
});

module.exports = BadgeUtilizador;