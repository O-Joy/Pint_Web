const jwt = require('jsonwebtoken');

// Middleware de autenticação JWT.
// Todas as rotas protegidas passam por aqui antes de chegar ao controller.
// O Flutter e o React enviam o token no header: Authorization: Bearer <token>

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Verifica se existe e tem o formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica a assinatura e a expiração do token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injeta os dados do utilizador autenticado no request.
    // Os controllers acedem com: req.user.idUtilizador, req.user.perfil, etc.
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faz login novamente.' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};