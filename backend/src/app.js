// O dotenv lê o ficheiro .env que foi criado na pasta backend/ e torna as variáveis disponíveis em qualquer sítio do código através de process.env.NOME_VARIAVEL.
// TEM DE SER A PRIMEIRA LINHA — antes de qualquer outro require, porque os outros ficheiros podem precisar das variáveis ao serem carregados.
require('dotenv').config();

const express = require('express');  // framework web — gere rotas e pedidos HTTP
const cors = require('cors');        // permite que o Flutter e o React façam pedidos a esta API
const path = require('path');        // utilitário do Node para trabalhar com caminhos de ficheiros

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
  res.json({ message: 'API a funcionar!' });
});

//Rotas da API

// =======   ADICIONAR AQUI AS ROTAS Á MEDIDA QUE CRIAMOS   ================

const authRoutes = require('./routes/auth.routes');
const badgesRoutes = require('./routes/badges.routes');
const perfilRoutes = require('./routes/perfil.routes');
const notificacoesRoutes = require('./routes/notificacoes.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const candidaturasRoutes = require('./routes/candidaturas.routes');
const talentManagerRoutes = require('./routes/talentmanager.routes');
const adminRoutes = require('./routes/admin.routes');
const dashboardConsultorRoutes = require('./routes/dashboardConsultor.routes');
const objetivosRoutes = require('./routes/objetivos.routes');
const servicelineRoutes = require('./routes/serviceline.routes');

app.use('/api/auth', authRoutes);
app.use('/api', badgesRoutes);
app.use('/api', perfilRoutes);
app.use('/api', notificacoesRoutes);
app.use('/api', gamificationRoutes);
app.use('/api', candidaturasRoutes);
app.use('/api', talentManagerRoutes);
app.use('/api', dashboardConsultorRoutes);
app.use('/api', objetivosRoutes);
app.use('/api', adminRoutes);
app.use('/api', servicelineRoutes);

//Arrancar o servidor

const sequelize = require('./config/database');

const PORT = process.env.PORT || 3001;  // // Lê a porta do .env
//  — se não existir usa 3001 por defeito

sequelize.authenticate()
  .then(() => {
    console.log('Ligação ao PostgreSQL estabelecida');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao ligar ao PostgreSQL:', err.message);
  });