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
 
const Utilizador = sequelize.define('Utilizador', {
  idUtilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_utilizador',
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'email',
  },
  passwordAsh: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'password_ash',
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_criacao',
  },
  ultimoLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ultimo_login',
  },
  aceitouRgpd: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'aceitou_rgpd',
  },
  dataAceitoRgpd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'data_aceito_rgpd',
  },
  ativo: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    field: 'ativo',
  },
  nomeUtilizador: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nome_utilizador',
  },
  linguaPadrao: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'lingua_padrao',
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'telefone',
  },
  urlLinkedin: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'url_linkedin',
  },
  urlFoto: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'url_foto',
  },
}, {
  tableName: 'utilizador',
  timestamps: false,
});
 
module.exports = Utilizador;