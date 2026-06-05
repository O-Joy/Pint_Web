// perfil.js — Middleware de autorização por perfil

module.exports = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.perfil) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Acesso negado. Perfil sem permissão.' });
    }

    next();
  };
};