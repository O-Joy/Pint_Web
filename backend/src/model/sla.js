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

const Sla = sequelize.define('Sla', {
  idSla: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_sla',
  },
  tipoAcao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tipo_acao',
  },
  tipoPerfil: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tipo_perfil',
  },
  horasMaxAcao: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'horas_max_acao',
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observacoes',
  },
}, {
  tableName: 'sla',
  timestamps: false,
});

module.exports = Sla;