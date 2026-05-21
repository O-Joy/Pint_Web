const bcrypt = require('bcrypt');
const Utilizador = require('../model/Utilizador');
const Consultor = require('../model/Consultor');
const Area = require('../model/Area');

// GET /api/areas
// Devolve todas as áreas activas para o dropdown das Definições
exports.getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({
      where: { ativo: 1 },
      attributes: ['idArea', 'nomeArea'],
      order: [['nomeArea', 'ASC']],
    });

    const resposta = areas.map(a => ({
      id: a.idArea,
      nome: a.nomeArea,
    }));

    res.json(resposta);
  } catch (erro) {
    console.error('[GET /areas]', erro);
    res.status(500).json({ error: 'Erro ao obter áreas.' });
  }
};

// PUT /api/perfil/password
// Altera a password do consultor autenticado
exports.alterarPassword = async (req, res) => {
  const { passwordAtual, novaPassword } = req.body;
  const idUtilizador = req.user.idUtilizador;

  if (!passwordAtual || !novaPassword) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
  }

  if (novaPassword.length < 6) {
    return res.status(400).json({ error: 'A nova password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const utilizador = await Utilizador.findOne({
      where: { idUtilizador },
    });

    if (!utilizador) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    // Verifica se a password actual está correcta
    const passwordCorreta = await bcrypt.compare(passwordAtual, utilizador.passwordAsh);
    if (!passwordCorreta) {
      return res.status(401).json({ error: 'Password atual incorreta.' });
    }

    // Gera hash da nova password e guarda
    const novaHash = await bcrypt.hash(novaPassword, 10);
    await utilizador.update({ passwordAsh: novaHash });

    res.json({ message: 'Password alterada com sucesso.' });
  } catch (erro) {
    console.error('[PUT /perfil/password]', erro);
    res.status(500).json({ error: 'Erro ao alterar password.' });
  }
};