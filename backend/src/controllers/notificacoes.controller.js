const Notificacao = require('../model/notificacao');
const UtilizadorNotificacao = require('../model/utilizadorNotificacao');
 
// GET /api/notificacoes
// Devolve todas as notificações do utilizador autenticado
exports.getNotificacoes = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
 
  try {
    // Vai buscar as ligações utilizador-notificacao deste utilizador
    const ligacoes = await UtilizadorNotificacao.findAll({
      where: { idUtilizador },
    });
 
    const ids = ligacoes.map((l) => l.idNotificacao);
 
    if (ids.length === 0) {
      return res.json([]);
    }
 
    const { Op } = require('sequelize');
    const notificacoes = await Notificacao.findAll({
      where: { idNotificacao: { [Op.in]: ids } },
      order: [['data', 'DESC']],
    });
 
    // Devolve os campos esperados pelo Flutter (fromJson do modelo Notificacao)
    const resultado = notificacoes.map((n) => ({
      id: n.idNotificacao,
      tipoNotificacao: n.tipoNotificacao,
      descricao: n.descricao,
      data: n.data,
      lida: false, // a lógica de lida é gerida localmente no SQLite do Flutter
      numCandidatura: n.numCandidatura,
      idObjetivo: n.idObjetivo,
      idBadgeUtilizador: n.idBadgeUtilizador,
      idBadgeEspecial: n.idBadgeEspecial,
    }));
 
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};
 
// DELETE /api/notificacoes/:id
// Remove a ligação entre o utilizador e a notificação (não apaga a notificação global)
exports.eliminarNotificacao = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const idNotificacao = parseInt(req.params.id);
 
  try {
    const eliminadas = await UtilizadorNotificacao.destroy({
      where: { idUtilizador, idNotificacao },
    });
 
    if (eliminadas === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
 
    res.json({ message: 'Notificação eliminada com sucesso.' });
  } catch (err) {
    console.error('Erro ao eliminar notificação:', err);
    res.status(500).json({ error: 'Erro ao eliminar notificação' });
  }
};