// candidaturas.controller.js
// Toda a lógica de negócio das candidaturas a badges regulares.
//
// ESTADOS (tabela estados_candidatura):
//   1 - Em Validação TM
//   2 - Em Retificação TM   ← consultor tem de agir
//   3 - Em Validação SLL
//   4 - Em Retificação SLL  ← consultor tem de agir
//   5 - Aprovada
//   6 - Rejeitada
//
// FLUXO:
//   Consultor cria candidatura (estado 0/rascunho interno → submetida → estado 1)
//   TM valida → aprova (→3) ou pede retificação (→2)
//   Consultor corrige → ressubmete (→3)
//   SLL valida → aprova (→5) ou pede retificação (→4)
//   Consultor corrige → ressubmete (→3)
const { Op } = require('sequelize');
const Candidatura       = require('../model/candidatura');
const HistoricoCandidatura = require('../model/historicoCandidatura');
const EstadosCandidatura   = require('../model/estadosCandidatura');
const Evidencia         = require('../model/evidencia');
const Requisitos        = require('../model/requisitos');
const BadgeRegular      = require('../model/badgeRegular');
const Nivel             = require('../model/nivel');
const Area              = require('../model/area');
const path              = require('path');
const fs                = require('fs');

// Estados que indicam que o TM/SLL devolveu a candidatura — o consultor
// tem de corrigir e reenviar
const ESTADOS_RETIFICACAO = [2, 4];
// Estados finais (já não estão em curso)
const ESTADOS_FINAIS = [5, 6];

// ─────────────────────────────────────────────────────────────
// HELPER: monta o nome do estado a partir do id
// ─────────────────────────────────────────────────────────────
async function getNomeEstado(idEstado) {
  const estado = await EstadosCandidatura.findOne({ where: { idEstado } });
  return estado ? estado.nomeEstado : 'Desconhecido';
}

// ─────────────────────────────────────────────────────────────
// GET /api/candidaturas/estados
// Lista todos os estados possíveis (para o Flutter popular o SQLite local)
// ─────────────────────────────────────────────────────────────
exports.getEstados = async (req, res) => {
  try {
    const estados = await EstadosCandidatura.findAll({ order: [['idEstado', 'ASC']] });
    const resultado = estados.map(e => ({
      id: e.idEstado,
      nomeEstado: e.nomeEstado,
      descricao: e.descricao,
    }));
    return res.json(resultado);
  } catch (err) {
    console.error('[candidaturas] getEstados:', err.message);
    return res.status(500).json({ error: 'Erro interno ao obter estados.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/candidaturas
// Lista todas as candidaturas do consultor autenticado
// ─────────────────────────────────────────────────────────────
exports.getCandidaturas = async (req, res) => {
  const idCandidato = req.user.idUtilizador;

  try {
    const candidaturas = await Candidatura.findAll({
      where: { 
        idCandidato,
        idEstadoAtual: {[Op.ne]: 0}, // Exclui rascunhos (estado 0)
      },
      order: [['dataCriacao', 'DESC']],
    });

    const resultado = await Promise.all(candidaturas.map(async (c) => {
      const nomeEstado = await getNomeEstado(c.idEstadoAtual);

      // Vai buscar o nome do badge, nível e área via JOIN manual (sem associações Sequelize)
      let nomeBadge = 'Desconhecido';
      let nomeNivel = null;
      let nomeArea = null;
      let pontos = null;
      const br = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      if (br) {
        nomeBadge = br.nomeBadge;
        pontos = br.pontos;
        if (br.idNivel) {
          const nivel = await Nivel.findOne({ where: { idNivel: br.idNivel } });
          if (nivel) nomeNivel = nivel.nomeNivel;
        }
        if (br.idArea) {
          const area = await Area.findOne({ where: { idArea: br.idArea } });
          if (area) nomeArea = area.nomeArea;
        }
      }

      const numRequisitos = await Requisitos.count({ where: { idBadgeRegular: c.idBadgeRegular } });

      // Data de decisão — a data do último registo de histórico com estado final (Aprovada/Rejeitada)
      let dataDecisao = null;
      if (ESTADOS_FINAIS.includes(c.idEstadoAtual)) {
        const ultimoHistorico = await HistoricoCandidatura.findOne({
          where: { numCandidatura: c.numCandidatura, idEstadoAtual: c.idEstadoAtual },
          order: [['dataAlteracao', 'DESC']],
        });
        dataDecisao = ultimoHistorico?.dataAlteracao ?? null;
      }

      return {
        numCandidatura: c.numCandidatura,
        idBadgeRegular: c.idBadgeRegular,
        idCandidato: c.idCandidato,
        idEstadoAtual: c.idEstadoAtual,
        dataCriacao: c.dataCriacao,
        dataDecisao,
        nomeBadge,
        nomeNivel,
        nomeArea,
        pontos,
        numRequisitos,
        nomeEstadoAtual: nomeEstado,
        acaoNecessaria: ESTADOS_RETIFICACAO.includes(c.idEstadoAtual),
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[candidaturas] getCandidaturas:', err.message);
    return res.status(500).json({ error: 'Erro interno ao obter candidaturas.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/candidaturas/:numCandidatura/detalhes
// Devolve o histórico e as evidências de uma candidatura
// O Flutter usa isto para o ecrã DetalheCandidatura (30)
// ─────────────────────────────────────────────────────────────
exports.getDetalhesCandidatura = async (req, res) => {
  const idCandidato = req.user.idUtilizador;
  const numCandidatura = parseInt(req.params.numCandidatura);

  try {
    // Garante que a candidatura pertence ao consultor autenticado
    const candidatura = await Candidatura.findOne({ where: { numCandidatura, idCandidato } });
    if (!candidatura) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Histórico (linha por transição de estado)
    const historico = await HistoricoCandidatura.findAll({
      where: { numCandidatura },
      order: [['dataAlteracao', 'ASC']],
    });

    const Utilizador = require('../model/utilizador');
    const SIGLA_RESPONSAVEL = { talent_manager: 'TM', sl_leader: 'SLL' };

    let estadoAnteriorNome = null; // vai andando à medida que percorremos por ordem cronológica
    const historicoFormatado = [];
    for (const h of historico) {
      let nomeResponsavel = null;
      if (h.idResponsavel) {
        const resp = await Utilizador.findOne({ where: { idUtilizador: h.idResponsavel } });
        const sigla = SIGLA_RESPONSAVEL[h.tipoResponsavel] || '';
        nomeResponsavel = resp ? `${resp.nomeUtilizador}${sigla ? ' - ' + sigla : ''}` : null;
      }

      historicoFormatado.push({
        idTransacao: h.idTransacao,
        numCandidatura: h.numCandidatura,
        idResponsavel: h.idResponsavel,
        nomeResponsavel,
        tipoResponsavel: h.tipoResponsavel,
        dataAlteracao: h.dataAlteracao,
        idEstadoAtual: h.idEstadoAtual,
        nomeEstadoAtual: await getNomeEstado(h.idEstadoAtual),
        estadoAnterior: estadoAnteriorNome,
        comentario: h.comentario,
      });

      estadoAnteriorNome = await getNomeEstado(h.idEstadoAtual);
    }

    // Evidências submetidas
    const evidencias = await Evidencia.findAll({
      where: { numCandidatura },
    });

    const evidenciasFormatadas = evidencias.map(e => ({
      id: e.idEvidencia,
      numCandidatura: e.numCandidatura,
      idRequisito: e.idRequisito,
      idResponsavel: e.idResponsavel,
      pathFicheiro: e.pathFicheiro,
      estado: e.estado,
    }));

    return res.json({ historico: historicoFormatado.reverse(), evidencias: evidenciasFormatadas });
  } catch (err) {
    console.error('[candidaturas] getDetalhesCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno ao obter detalhes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/candidaturas
// Cria uma nova candidatura (em rascunho — estado 1 = Em Validação TM,
// mas só depois de submeter; aqui fica com id_estado = 0 não existe —
// por isso criamos diretamente no estado "rascunho" sem historico).
// Na prática: cria a candidatura com estado 1 SÓ após submeter.
// Este endpoint cria o registo inicial (sem histórico) — o consultor
// ainda não submeteu, apenas iniciou o processo.
//
// NOTA: Para simplificar o fluxo do Flutter (ecrã 31), a candidatura
// fica criada sem estado formal até ser submetida. Usamos id_estado = 0
// como "rascunho interno" — o Flutter não mostra no histórico.
// ─────────────────────────────────────────────────────────────
exports.criarCandidatura = async (req, res) => {
  const idCandidato = req.user.idUtilizador;
  const { idBadgeRegular } = req.body;

  if (!idBadgeRegular) {
    return res.status(400).json({ error: 'idBadgeRegular é obrigatório.' });
  }

  try {
    // Valida que o badge existe
    const badge = await BadgeRegular.findOne({ where: { idBadgeRegular } });
    if (!badge) {
      return res.status(404).json({ error: 'Badge não encontrado.' });
    }

    // Impede candidatura duplicada em curso (estados 1-4 = processo ativo)
    const emCurso = await Candidatura.findOne({
      where: {
        idBadgeRegular,
        idCandidato,
        // estado entre 1 e 4 = ainda está no processo de validação
      },
    });

    // Verifica se existe candidatura activa (estado 1, 2, 3 ou 4)
    if (emCurso && [1, 2, 3, 4].includes(emCurso.idEstadoAtual)) {
      return res.status(409).json({ error: 'Já tens uma candidatura em curso para este badge.' });
    }

    // Cria a candidatura em estado 0 (rascunho — ainda sem submissão)
    // O estado 0 não existe na tabela estados_candidatura, serve apenas
    // para indicar ao Flutter que está em construção (ecrã nova_candidatura)
    // Nota: se preferires omitir o estado 0, cria directamente com estado 1
    // e só envia o email/notificação após submeter.
    const candidatura = await Candidatura.create({
      idBadgeRegular,
      idCandidato,
      idEstadoAtual: 0,  // 0 = Rascunho (pré-submissão, ainda sem evidências)
      dataCriacao: new Date(),
    });

    return res.status(201).json({ numCandidatura: candidatura.numCandidatura });
  } catch (err) {
    console.error('[candidaturas] criarCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno ao criar candidatura.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/candidaturas/:numCandidatura/evidencias
// Faz upload de um ficheiro como evidência de um requisito
// Usa multer (configurado nas rotas) para receber o ficheiro
// O campo do formulário deve chamar-se "ficheiro"
// ─────────────────────────────────────────────────────────────
exports.uploadEvidencia = async (req, res) => {
  const idCandidato = req.user.idUtilizador;
  const numCandidatura = parseInt(req.params.numCandidatura);
  const { idRequisito } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Ficheiro não recebido.' });
  }
  if (!idRequisito) {
    return res.status(400).json({ error: 'idRequisito é obrigatório.' });
  }

  try {
    // Verifica que a candidatura existe e pertence ao consultor
    const candidatura = await Candidatura.findOne({ where: { numCandidatura, idCandidato } });
    if (!candidatura) {
      // Remove o ficheiro já guardado pelo multer se a candidatura não existe
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Verifica que o requisito existe e pertence ao badge da candidatura
    const requisito = await Requisitos.findOne({ where: { idRequisito } });
    if (!requisito || requisito.idBadgeRegular !== candidatura.idBadgeRegular) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Requisito inválido para este badge.' });
    }

    // Verifica se já existe evidência para este requisito nesta candidatura
    const existente = await Evidencia.findOne({ where: { numCandidatura, idRequisito } });
    if (existente) {
      // Remove o ficheiro antigo e actualiza o registo
      const caminhoAntigo = path.join(__dirname, '../../', existente.pathFicheiro);
      fs.unlink(caminhoAntigo, () => {});
      await existente.update({
        pathFicheiro: req.file.path.replace(/\\/g, '/'),
        estado: 'pendente',
        idResponsavel: null,
      });
      return res.status(201).json({ message: 'Evidência actualizada.' });
    }

    // Cria a evidência nova
    await Evidencia.create({
      numCandidatura,
      idRequisito: parseInt(idRequisito),
      idResponsavel: null,
      pathFicheiro: req.file.path.replace(/\\/g, '/'),
      estado: 'pendente',
    });

    return res.status(201).json({ message: 'Evidência submetida com sucesso.' });
  } catch (err) {
    console.error('[candidaturas] uploadEvidencia:', err.message);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ error: 'Erro interno ao guardar evidência.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/candidaturas/:numCandidatura/submeter
// Submete a candidatura para validação pelo TM
// Valida que todos os requisitos têm evidência antes de aceitar
// Muda o estado para 1 (Em Validação TM) e regista no histórico
// ─────────────────────────────────────────────────────────────
exports.submeterCandidatura = async (req, res) => {
  const idCandidato = req.user.idUtilizador;
  const numCandidatura = parseInt(req.params.numCandidatura);

  try {
    const candidatura = await Candidatura.findOne({ where: { numCandidatura, idCandidato } });
    if (!candidatura) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Só pode submeter se estiver em rascunho (0) ou retificação (2 ou 4) ou
    if (![0, 2, 4].includes(candidatura.idEstadoAtual)) {
      return res.status(400).json({ error: 'Esta candidatura não pode ser submetida no estado atual.' });
    }

    // Valida que todos os requisitos do badge têm evidência
    const requisitos = await Requisitos.findAll({
      where: { idBadgeRegular: candidatura.idBadgeRegular },
    });

    if (requisitos.length > 0) {
      const evidencias = await Evidencia.findAll({ where: { numCandidatura } });
      const idsComEvidencia = new Set(evidencias.map(e => e.idRequisito));
      const semEvidencia = requisitos.filter(r => !idsComEvidencia.has(r.idRequisito));

      if (semEvidencia.length > 0) {
        const nomes = semEvidencia.map(r => r.nomeRequisito).join(', ');
        return res.status(400).json({
          error: `Faltam evidências para: ${nomes}`,
        });
      }
    }

    // Determina o próximo estado:
    // Se vem de retificação SLL (4) → volta ao SLL (3)
    // Caso contrário → TM (1)
    const novoEstado = candidatura.idEstadoAtual === 4 ? 3 : 1;

    // Actualiza o estado da candidatura
    await candidatura.update({ idEstadoAtual: novoEstado });

    // Regista no histórico
    await HistoricoCandidatura.create({
      numCandidatura,
      idResponsavel: null,   // null = acção do próprio consultor
      tipoResponsavel: null,
      dataAlteracao: new Date(),
      idEstadoAtual: novoEstado,
      comentario: 'Candidatura submetida pelo consultor.',
    });

    return res.json({ message: 'Candidatura submetida com sucesso.', estado: novoEstado });
  } catch (err) {
    console.error('[candidaturas] submeterCandidatura:', err.message);
    return res.status(500).json({ error: 'Erro interno ao submeter candidatura.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/candidaturas/:numCandidatura
// Apaga uma candidatura — só permite se estiver em estado 0 (rascunho)
// ─────────────────────────────────────────────────────────────
exports.cancelarRascunho = async (req, res) => {
  const idCandidato = req.user.idUtilizador;
  const numCandidatura = parseInt(req.params.numCandidatura);

  try {
    const candidatura = await Candidatura.findOne({
      where: { numCandidatura, idCandidato },
    });

    if (!candidatura) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    // Segurança: só permite apagar se for rascunho (estado 0)
    if (candidatura.idEstadoAtual !== 0) {
      return res.status(403).json({ 
        error: 'Só é possível cancelar candidaturas em rascunho.' 
      });
    }

    // 1. Primeiro apaga os ficheiros físicos do disco
    const evidencias = await Evidencia.findAll({ where: { numCandidatura } });
    for (const ev of evidencias) {
      if (ev.pathFicheiro && fs.existsSync(ev.pathFicheiro)) {
        fs.unlinkSync(ev.pathFicheiro);
      }
    }

    // 2. Depois apaga os registos das evidências da BD
    await Evidencia.destroy({ where: { numCandidatura } });

    // 3. Por fim apaga a candidatura
    await candidatura.destroy();

    return res.json({ message: 'Rascunho cancelado com sucesso.' });
  } catch (err) {
    console.error('[candidaturas] cancelarRascunho:', err.message);
    return res.status(500).json({ error: 'Erro ao cancelar rascunho.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/candidaturas/rascunhos
// Lista todos os rascunhos (estado 0) do consultor autenticado
// ─────────────────────────────────────────────────────────────
exports.getRascunhos = async (req, res) => {
  const idCandidato = req.user.idUtilizador;

  try {
    const rascunhos = await Candidatura.findAll({
      where: { idCandidato, idEstadoAtual: 0 },
      order: [['dataCriacao', 'DESC']],
    });

    const resultado = await Promise.all(rascunhos.map(async (c) => {
      // Vai buscar o nome do badge e nível
      let nomeBadge = 'Desconhecido';
      let nomeNivel = null;
      const br = await BadgeRegular.findOne({ where: { idBadgeRegular: c.idBadgeRegular } });
      if (br) {
        nomeBadge = br.nomeBadge;
        if (br.idNivel) {
          const nivel = await Nivel.findOne({ where: { idNivel: br.idNivel } });
          if (nivel) nomeNivel = nivel.nomeNivel;
        }
      }

      // Conta evidências já carregadas e requisitos totais
      const numEvidencias = await Evidencia.count({ where: { numCandidatura: c.numCandidatura } });
      const numRequisitos = await Requisitos.count({ where: { idBadgeRegular: c.idBadgeRegular } });

      return {
        numCandidatura: c.numCandidatura,
        idBadgeRegular: c.idBadgeRegular,
        nomeBadge,
        nomeNivel,
        dataCriacao: c.dataCriacao,
        numEvidencias,
        numRequisitos,
      };
    }));

    return res.json(resultado);
  } catch (err) {
    console.error('[candidaturas] getRascunhos:', err.message);
    return res.status(500).json({ error: 'Erro interno ao obter rascunhos.' });
  }
};