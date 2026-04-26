const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilizador = require('../model/Utilizador');
const Consultor = require('../model/Consultor');
const Area = require('../model/Area');
const LearningPath = require('../model/LearningPath');

const codigosRecuperacao = new Map();

//LOGIN

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password são obrigatórios' });
  }

  try {
    // Busca o utilizador pelo email
    const utilizador = await Utilizador.findOne({ where: { email } });

    if (!utilizador) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (utilizador.ativo === 0) {
      return res.status(403).json({ error: 'Conta inativa. Contacta o administrador.' });
    }

    // Compara a password com o hash guardado na BD
    const passwordValida = await bcrypt.compare(password, utilizador.passwordAsh);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Determina o perfil do utilizador — verifica em cada um das tabelas filho por ordem
    let perfil = null;
    let dadosPerfil = {};

    const TalentManager = require('../model/TalentManager');
    const SlLeader = require('../model/SlLeader');
    const Administrador = require('../model/Administrador');

     //Se for consutor:
    const consultor = await Consultor.findOne({ where: { idUtilizador: utilizador.idUtilizador } });
    if (consultor) {
      perfil = 'consultor';
s
      let nomeArea = null;
      let nomeLearningPath = null;

      if (consultor.idArea) {
        const area = await Area.findOne({ where: { idArea: consultor.idArea } });
        nomeArea = area ? area.nomeArea : null;
      }
      if (consultor.idLearningPath) {
        const lp = await LearningPath.findOne({ where: { idLearningPath: consultor.idLearningPath } });
        nomeLearningPath = lp ? lp.nomeLp : null;
      }

      dadosPerfil = {
        idArea: consultor.idArea,
        nomeArea,
        idLearningPath: consultor.idLearningPath,
        nomeLearningPath,
        configuracaoCompleta: !!(consultor.idArea && consultor.idLearningPath),
      };
    }

    //Se fo TM
    if (!perfil) {
      const tm = await TalentManager.findOne({ where: { idUtilizador: utilizador.idUtilizador } });
      if (tm) {
        perfil = 'talent_manager';
        dadosPerfil = {
          idArea: tm.idArea,
          idServiceLine: tm.idServiceLine,
        };
      }
    }

    //Se for SLL
    if (!perfil) {
      const sll = await SlLeader.findOne({ where: { idUtilizador: utilizador.idUtilizador } });
      if (sll) {
        perfil = 'sl_leader';
        dadosPerfil = {
          idServiceLine: sll.idServiceLine,
        };
      }
    }

    //Se for admin
    if (!perfil) {
      const admin = await Administrador.findOne({ where: { idUtilizador: utilizador.idUtilizador } });
      if (admin) perfil = 'administrador';
    }

    if (!perfil) {
      return res.status(403).json({ error: 'Utilizador sem perfil definido.' });
    }

    // Actualiza o último login na app
    await Utilizador.update(
      { ultimoLogin: new Date() },
      { where: { idUtilizador: utilizador.idUtilizador } }
    );

    // Cria o token JWT — inclui o perfil para os middlewares de autorização
    const token = jwt.sign(
      {
        idUtilizador: utilizador.idUtilizador,
        email: utilizador.email,
        perfil,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Devolve o token e o perfil
    res.json({
      token,
      perfil,
      utilizador: {
        id: utilizador.idUtilizador,
        nome: utilizador.nomeUtilizador,
        email: utilizador.email,
        urlFoto: utilizador.urlFoto,
        telefone: utilizador.telefone,
        urlLinkedin: utilizador.urlLinkedin,
        linguaPadrao: utilizador.linguaPadrao,
        dataMembro: utilizador.dataCriacao,
        ...dadosPerfil,
      },

    // Campo para o Flutter — só existe quando o perfil é 'consultor'
    // Para TM, SLL e Admin este campo não aparece na resposta
    // O Flutter (api_service.dart) lê: json['consultor']
      consultor: perfil === 'consultor' ? {
        id: utilizador.idUtilizador,
        nome: utilizador.nomeUtilizador,
        email: utilizador.email,
        urlFoto: utilizador.urlFoto,
        telefone: utilizador.telefone,
        urlLinkedin: utilizador.urlLinkedin,
        linguaPadrao: utilizador.linguaPadrao,
        dataMembro: utilizador.dataCriacao,
        ...dadosPerfil,
      } : undefined,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

//RECUPERAR PASSWORD
// EComo não há email real configurado, o código é devolvido na resposta JSON no campo 'codigo'.
// Sugiro que o cliente (Flutter ou React) use o código para este preencher automaticamente o campo de código no ecrã
// De futuro somos capazes de usar nodemailler...não tenho a certeza

exports.recuperarPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email, ativo: 1 } });

    // Responde sempre com sucesso — não revela se o email existe
    if (!utilizador) {
      return res.json({ message: 'Receberás um código em breve.' });
    }

    // Gera um código de 5 dígitos
    const codigo = Math.floor(10000 + Math.random() * 90000).toString();

    // Guarda o código com validade de 15 minutos
    codigosRecuperacao.set(email, {
      codigo,
      expira: new Date(Date.now() + 15 * 60 * 1000),
    });

    // DEVOLVE CODIGO DIRETAMENTE PORQUE NAO HA MAIL REAL CONFIGURADO
    res.json({
      message: 'Código gerado com sucesso.',
      codigo, // REMOVER NO FUTURO CASO HAJA MUDANÇAS
    });
  } catch (err) {
    console.error('Erro ao recuperar password:', err);
    res.status(500).json({ error: 'Erro ao gerar código' });
  }
};

//VERIFICAR CÓDIGO
exports.verificarCodigo = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ error: 'O código é obrigatório.' });
  }

  const entrada = codigosRecuperacao.get(email);

  if (!entrada) {
    return res.status(400).json({ error: 'Nenhum código activo.' });
  }

  if (new Date() > entrada.expira) {
    codigosRecuperacao.delete(email);
    return res.status(400).json({ error: 'Código expirado.' });
  }

  if (entrada.codigo !== codigo) {
    return res.status(400).json({ error: 'Código inválido' });
  }

  // Emite um token temporário de 10 minutos só para redefinir a password
  const tokenReset = jwt.sign(
    { email, tipo: 'reset_password' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  res.json({ token_reset: tokenReset });
};

// REDEFINIR PASSWORD

exports.redefinirPassword = async (req, res) => {
  const { token_reset, nova_password } = req.body;

  if (!token_reset || !nova_password) {
    return res.status(400).json({ error: 'Defina uma nova password' });
  }

  if (nova_password.length < 8) {
    return res.status(400).json({ error: 'A password deve ter pelo menos 8 caracteres' });
  }

  try {
    const decoded = jwt.verify(token_reset, process.env.JWT_SECRET);

    if (decoded.tipo !== 'reset_password') {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const hash = await bcrypt.hash(nova_password, 10);

    await Utilizador.update(
      { passwordAsh: hash },
      { where: { email: decoded.email } }
    );

    codigosRecuperacao.delete(decoded.email);

    res.json({ message: 'Password redefinida com sucesso.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'O prazo para redefinir a password expirou.' });
    }
    console.error('Erro ao redefinir password:', err);
    res.status(500).json({ error: 'Erro ao redefinir password' });
  }
};

//CONFIGURAÇÃO INICIAL - escolher a area no primeiro login

exports.configuracaoInicial = async (req, res) => {
  const { idArea } = req.body;
  const idUtilizador = req.user.idUtilizador;

  if (!idArea) {
    return res.status(400).json({ error: 'Área é obrigatória' });
  }

  try {
    await Consultor.update(
      { idArea },
      { where: { idUtilizador } }
    );

    res.json({ message: 'Área guardada com sucesso.' });
  } catch (err) {
    console.error('Erro na configuração inicial:', err);
    res.status(500).json({ error: 'Erro ao guardar configuração' });
  }
};