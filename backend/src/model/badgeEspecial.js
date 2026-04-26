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

const BadgeEspecial = sequelize.define('BadgeEspecial', {
  idBadgeEspecial: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_badge_especial',
  },
  idLearningPath: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_learning_path',
  },
  nomeBadgeEspecial: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nome_badge_especial',
  },
  pontos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pontos',
  },
  validadeDias: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'validade_dias',
  },
  ativo: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'ativo',
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descricao',
  },
  urlImagemEspecial: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'url_imagem_especial',
  },
}, {
  tableName: 'badge_especial',
  timestamps: false,
});

module.exports = BadgeEspecial;