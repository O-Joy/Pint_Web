// controllers/configuracoes.controller.js
// Configurações editáveis pelo Administrador (ex: Política de Privacidade e RGPD),
// guardadas na tabela genérica "configuracoes" (chave/conteúdo).

const Configuracao = require('../model/configuracao');

// GET /api/configuracoes/:chave — pública (tem de poder ser lida mesmo sem sessão iniciada)
exports.getConfiguracao = async (req, res) => {
  try {
    const config = await Configuracao.findOne({ where: { chave: req.params.chave } });
    if (!config) return res.status(404).json({ error: 'Configuração não encontrada.' });
    return res.json({ chave: config.chave, conteudo: config.conteudo, dataAlteracao: config.dataAlteracao });
  } catch (err) {
    console.error('[configuracoes] getConfiguracao:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar configuração.' });
  }
};

// PUT /api/configuracoes/:chave — só o Administrador pode editar
exports.atualizarConfiguracao = async (req, res) => {
  try {
    const { conteudo } = req.body;
    if (!conteudo || !conteudo.trim()) {
      return res.status(400).json({ error: 'O conteúdo não pode estar vazio.' });
    }

    const [config] = await Configuracao.findOrCreate({
      where: { chave: req.params.chave },
      defaults: { conteudo, idUtilizador: req.user.idUtilizador },
    });
    config.conteudo = conteudo;
    config.idUtilizador = req.user.idUtilizador;
    config.dataAlteracao = new Date();
    await config.save();

    return res.json({ chave: config.chave, conteudo: config.conteudo, dataAlteracao: config.dataAlteracao });
  } catch (err) {
    console.error('[configuracoes] atualizarConfiguracao:', err.message);
    return res.status(500).json({ error: 'Erro ao atualizar configuração.' });
  }
};
