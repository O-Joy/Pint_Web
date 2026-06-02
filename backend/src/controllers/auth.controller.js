const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilizador = require('../model/Utilizador');
const Consultor = require('../model/Consultor');
const Area = require('../model/Area');
const LearningPath = require('../model/LearningPath');
const { sequelize } = require('../model/utilizador');
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

      // Verifica se é o primeiro acesso ANTES de atualizar — se ultimoAcesso for null, nunca entrou
      const primeiroAcesso = utilizador.ultimoLogin === null;

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
        primeiroAcesso,
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

    // Atualiza o ultimo login para TODOS os perfis
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

// RECUPERAR PASSWORD
// Gera um código de 5 dígitos, guarda-o em memória com validade de 15 minutos
// e envia-o por email para o utilizador
// NOTA: como os emails na BD são fictícios, o email é enviado para o EMAIL_USER
//       configurado no .env — ou seja, para o teu próprio email de aluno

exports.recuperarPassword = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' })
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email, ativo: 1 } })

    // Responde sempre com sucesso para não revelar se o email existe na BD
    // (medida de segurança — evita que alguém descubra quais emails estão registados)
    if (!utilizador) {
      return res.json({ message: 'Se o email existir, receberás um código em breve.' })
    }

    // Gera um código aleatório de 5 dígitos
    const codigo = Math.floor(10000 + Math.random() * 90000).toString()

    // Guarda o código em memória com o email como chave e validade de 15 minutos
    // Em produção seria melhor guardar na BD, mas para este projeto é suficiente
    codigosRecuperacao.set(email, {
      codigo,
      expira: new Date(Date.now() + 15 * 60 * 1000),
    })

    // Envia o código por email
    // Como os emails são fictícios, enviamos para o EMAIL_USER (o teu email real)
    // Em produção enviaria para o email do utilizador
    const transporter = require('../config/mailer')
    await transporter.sendMail({
      from: `"BadgeBoost Softinsa" <${process.env.EMAIL_USER}>`,
      to: utilizador.email, // envia para ti em vez do email fictício
      subject: 'Código de recuperação de password — BadgeBoost',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #39639C;">BadgeBoost</h2>
          <p>Olá, <strong>${utilizador.nomeUtilizador}</strong>.</p>
          <p>Recebemos um pedido de recuperação de password para a conta <strong>${email}</strong>.</p>
          <p>O teu código de verificação é:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #39639C;">
              ${codigo}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira em 15 minutos.</p>
          <p style="color: #6b7280; font-size: 14px;">Se não pediste a recuperação de password, ignora este email.</p>
        </div>
      `,
    })

    // Responde com sucesso — não inclui o código na resposta por razões de segurança
    res.json({ message: 'Código enviado com sucesso.' })

  } catch (err) {
    console.error('Erro ao recuperar password:', err)
    res.status(500).json({ error: 'Erro ao enviar código. Tenta novamente.' })
  }
}

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

exports.getPoliticaPrivacidade = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT conteudo FROM configuracoes WHERE chave = 'politica_privacidade'"
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ conteudo: rows[0].conteudo });
  } catch (e) {
    console.error('Erro ao obter política de privacidade:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
};