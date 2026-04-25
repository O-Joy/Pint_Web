const { Sequelize } = require('sequelize');

// Cria a ligação ao PostgreSQL usando as credenciais do ficheiro .env
const sequelize = new Sequelize(
  process.env.DB_NAME,     // nome da base de dados
  process.env.DB_USER,     // utilizador do postgres
  process.env.DB_PASSWORD, // password do postgres
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432, //porto do postgres por defeito
    dialect: 'postgres', // diz ao Sequelize que estamos a usar PostgreSQL
    logging: false,      // desliga as queries SQL no terminal -> colocar a true para ver as queries
  }
);

module.exports = { sequelize };