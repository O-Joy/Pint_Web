// O dotenv lê o ficheiro .env que criado na pasta backend/ e torna as variáveis disponíveis em qualquer sítio do código através de process.env.NOME_VARIAVEL.
// TEM DE SER A PRIMEIRA LINHA — antes de qualquer outro require, porque os outros ficheiros podem precisar das variáveis ao serem carregados.
require('dotenv').config();

const express = require('express');  // framework web — gere rotas e pedidos HTTP
const cors = require('cors');        // permite que o Flutter e o React façam pedidos a esta API
const path = require('path');        // utilitário do Node para trabalhar com caminhos de ficheiros
const { sequelize } = require('./model'); //import do objeto sequalize

const app = express(); // cria a aplicação Express (servidor)

//========================
//MIDDLEWARES (açoes que ocorrem entre o pedido e a resposta)

// CORS - remove restrições, permitindo queo React façam pedidos à API.
app.use(cors());

// Permite que o Express leia o corpo (body) dos pedidos POST e PUT em formato JSON.
// Sem isto, req.body estaria sempre vazio nos controllers.
app.use(express.json());

// Permite receber dados de formulários HTML
// O extended: true permite objectos e arrays no body, não só strings simples.
app.use(express.urlencoded({ extended: true }));

// Serve o URL que permite React e Flutter acederem aos ficheiros de upload
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//======================

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API BadgeBoost a funcionar!' });
});

//Rotas da API

// =======   ADICIONAR AQUI AS ROTAS Á MEDIDA QUE CRIAMOS   ================

//Arrancar o servidor

const PORT = process.env.PORT || 3001; // Lê a porta do .env (Postges) — se não existir usa 3001 por defeito

sequelize.authenticate() //ligação
  .then(() => {
    console.log('✅ Ligação ao PostgreSQL estabelecida');
    app.listen(PORT, () => {
      console.log(`✅ Servidor na porta ${PORT}`);
    });
  })
  .catch(err => { //erro
    console.error('Erro ao ligar ao PostgreSQL:', err.message);
  });