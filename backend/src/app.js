const express = require('express');
const app = express();

// Configurações
app.set('port', process.env.PORT || 3001);

// Middlewares
// Permite que a API receba e envie dados em formato JSON
app.use(express.json());

// Rota de teste — para confirmar que o servidor está a funcionar
app.use('/', (req, res) => {
  res.send('API Pint 2526 a funcionar!');
});

// Arrancar o servidor
app.listen(app.get('port'), () => {
  console.log('Servidor disponível na porta ' + app.get('port'));
});