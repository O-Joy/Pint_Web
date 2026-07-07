const Notificacao = require('../model/notificacao');
const UtilizadorNotificacao = require('../model/utilizadorNotificacao');
const Candidatura = require('../model/candidatura');
const Utilizador = require('../model/utilizador');
 
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
 
    // lida vem de utilizador_notificacao (por utilizador), não da notificacao (global)
    const lidaMap = {};
    ligacoes.forEach((l) => {
      lidaMap[l.idNotificacao] = l.lida;
    });

    // Devolve os campos esperados pelo Flutter (fromJson do modelo Notificacao)
    const resultado = await Promise.all(notificacoes.map(async (n) => {
      let remetenteNome = null;
      let remetenteFoto = null;

      if (n.numCandidatura) {
        const candidatura = await Candidatura.findOne({ where: { numCandidatura: n.numCandidatura } });
        if (candidatura?.idCandidato) {
          const utilizador = await Utilizador.findOne({ where: { idUtilizador: candidatura.idCandidato } });
          if (utilizador) {
            remetenteNome = utilizador.nomeUtilizador;
            remetenteFoto = utilizador.urlFoto;
          }
        }
      }

      return {
        id: n.idNotificacao,
        tipoNotificacao: n.tipoNotificacao,
        descricao: n.descricao,
        data: n.data,
        lida: lidaMap[n.idNotificacao] ?? false,
        numCandidatura: n.numCandidatura,
        idObjetivo: n.idObjetivo,
        idBadgeUtilizador: n.idBadgeUtilizador,
        idBadgeEspecial: n.idBadgeEspecial,
        remetenteNome,
        remetenteFoto,
      };
    }));
 
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// PUT - > lida
exports.marcarLida = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const idNotificacao = parseInt(req.params.id);
 
  try {
    const [updated] = await UtilizadorNotificacao.update(
      { lida: true },
      { where: { idUtilizador, idNotificacao } }
    );
 
    if (updated === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
 
    res.json({ message: 'Notificação marcada como lida.' });
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ error: 'Erro ao marcar como lida.' });
  }
};
 
// PUT -> marcar como não lida
exports.marcarNaoLida = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;
  const idNotificacao = parseInt(req.params.id);

  try {
    const [updated] = await UtilizadorNotificacao.update(
      { lida: false },
      { where: { idUtilizador, idNotificacao } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    res.json({ message: 'Notificação marcada como não lida.' });
  } catch (err) {
    console.error('Erro ao marcar notificação como não lida:', err);
    res.status(500).json({ error: 'Erro ao marcar como não lida.' });
  }
};

// PUT -> marcar todas como lidas
exports.marcarTodasLidas = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    await UtilizadorNotificacao.update({ lida: true }, { where: { idUtilizador } });
    res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  } catch (err) {
    console.error('Erro ao marcar todas como lidas:', err);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas.' });
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