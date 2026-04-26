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

const BadgeRegular = sequelize.define('BadgeRegular', {
  idBadgeRegular: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_badge_regular',
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
  idServiceLine: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_service_line',
  },
  idNivel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'id_nivel',
  },
  nomeBadge: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nome_badge',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
  pontos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pontos',
  },
  ativo: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'ativo',
  },
  validadeDias: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'validade_dias',
  },
  urlImagemBadge: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'url_imagem_badge',
  },
}, {
  tableName: 'badge_regular',
  timestamps: false,
});

module.exports = BadgeRegular;