// Lógica de progresso dos objetivos para dashboard e página de Objetivos,

// Cinco tipos de objetivo definidos em bd:
// 1. Completar Área
// 2. Completar Service Line
// 3. Completar Learning Path
// 4. Atingir Nível Líder
// 5. Atingir Topo Gamification

const { Op } = require('sequelize');
const BadgeUtilizador = require('../model/badgeUtilizador');
const BadgeRegular = require('../model/badgeRegular');
const BadgeEspecial = require('../model/badgeEspecial');
const Consultor = require('../model/consultor');
const Area = require('../model/area');
const Nivel = require('../model/nivel');

// Ordem dos níveis para organização

const ORDEM_NIVEIS = ['JN', 'IN', 'SN', 'EP', 'LD'];

const TIPO_COMPLETAR_AREA = 1;
const TIPO_COMPLETAR_SERVICE_LINE = 2;
const TIPO_COMPLETAR_LEARNING_PATH = 3;
const TIPO_ATINGIR_NIVEL_LIDER = 4;
const TIPO_ATINGIR_TOPO_GAMIFICATION = 5;

// Reúne tudo o que é preciso para calcular progresso de qualquer objetivo
// de um consultor, para não se repetir a mesma query por cada objetivo.
async function construirContexto(idUtilizador) {
  const consultor = await Consultor.findOne({ where: { idUtilizador } });
  const idAreaConsultor = consultor?.idArea ?? null;
  const idLearningPathConsultor = consultor?.idLearningPath ?? null;

  const areaConsultor = idAreaConsultor
    ? await Area.findOne({ where: { idArea: idAreaConsultor } })
    : null;
  const idServiceLineConsultor = areaConsultor?.idServiceLine ?? null;

  const badgesUtilizador = await BadgeUtilizador.findAll({ where: { idUtilizador, valido: 1 } });
  const idsBadgeRegularGanhos = badgesUtilizador.filter(b => b.idBadgeRegular).map(b => b.idBadgeRegular);
  const idsBadgeEspecialGanhos = badgesUtilizador.filter(b => b.idBadgeEspecial).map(b => b.idBadgeEspecial);

  const badgesRegularesGanhos = idsBadgeRegularGanhos.length
    ? await BadgeRegular.findAll({ where: { idBadgeRegular: { [Op.in]: idsBadgeRegularGanhos } } })
    : [];

  return {
    idAreaConsultor,
    idServiceLineConsultor,
    idLearningPathConsultor,
    badgesRegularesGanhos,
    idsBadgeEspecialGanhos,
  };
}

// Calcula { atual, meta, percentagem, formato, concluido } para UM objetivo.
// rankingGeral só é preciso para o tipo 5 — passa null se não for relevante.
async function calcularProgresso(obj, contexto, rankingGeral) {
  const { idAreaConsultor, idServiceLineConsultor, idLearningPathConsultor, badgesRegularesGanhos, idsBadgeEspecialGanhos } = contexto;

  let atual = 0;
  let meta = 1;
  let formato = 'fracao'; // fracao -> "x/5"  |  posicao -> "xº (meta: Top 3)"

  switch (obj.idTipoObjetivo) {
    case TIPO_COMPLETAR_AREA: {
      meta = await BadgeRegular.count({ where: { idArea: idAreaConsultor, ativo: 1 } });
      atual = badgesRegularesGanhos.filter(b => b.idArea === idAreaConsultor).length;
      break;
    }

    case TIPO_COMPLETAR_SERVICE_LINE: {
      meta = await BadgeRegular.count({ where: { idServiceLine: idServiceLineConsultor, ativo: 1 } });
      atual = badgesRegularesGanhos.filter(b => b.idServiceLine === idServiceLineConsultor).length;
      break;
    }

    case TIPO_COMPLETAR_LEARNING_PATH: {
      const idLP = obj.idLearningPath ?? idLearningPathConsultor;
      const totalRegulares = await BadgeRegular.count({ where: { idLearningPath: idLP, ativo: 1 } });
      const totalEspeciais = await BadgeEspecial.count({ where: { idLearningPath: idLP, ativo: 1 } });
      meta = totalRegulares + totalEspeciais;

      const ganhosRegulares = badgesRegularesGanhos.filter(b => b.idLearningPath === idLP).length;
      const ganhosEspeciais = idsBadgeEspecialGanhos.length
        ? await BadgeEspecial.count({ where: { idBadgeEspecial: { [Op.in]: idsBadgeEspecialGanhos }, idLearningPath: idLP } })
        : 0;
      atual = ganhosRegulares + ganhosEspeciais;
      break;
    }

    case TIPO_ATINGIR_NIVEL_LIDER: {
      meta = ORDEM_NIVEIS.length; // 5 (Júnior -> Líder)
      const idsNiveisGanhos = badgesRegularesGanhos
        .filter(b => b.idArea === idAreaConsultor)
        .map(b => b.idNivel);
      const niveisGanhos = idsNiveisGanhos.length
        ? await Nivel.findAll({ where: { idNivel: { [Op.in]: idsNiveisGanhos } } })
        : [];
      const posicoes = niveisGanhos
        .map(n => ORDEM_NIVEIS.indexOf(n.tipo) + 1)
        .filter(p => p > 0);
      atual = posicoes.length ? Math.max(...posicoes) : 0;
      break;
    }

    case TIPO_ATINGIR_TOPO_GAMIFICATION: {
      meta = 3;
      formato = 'posicao';
      const minhaPosicao = rankingGeral?.find(r => r.idUtilizador === obj.idUtilizador);
      atual = minhaPosicao?.posicao ?? null;
      break;
    }

    default:
      meta = 1;
      atual = 0;
  }

  const atualLimitado = formato === 'fracao' ? Math.min(atual, meta) : atual;
  let percentagem = 0;
  let concluido = false;

  if (formato === 'fracao') {
    percentagem = meta > 0 ? Math.round((atualLimitado / meta) * 100) : 0;
    concluido = meta > 0 && atualLimitado >= meta;
  } else if (atual != null) {
    const totalRanking = rankingGeral?.length ?? atual;
    percentagem = atual <= meta
      ? 100
      : Math.round(Math.max(0, (totalRanking - atual) / Math.max(1, totalRanking - meta)) * 100);
    concluido = atual <= meta;
  }

  return { atual: atualLimitado, meta, percentagem, formato, concluido };
}

module.exports = {
  ORDEM_NIVEIS,
  TIPO_COMPLETAR_AREA,
  TIPO_COMPLETAR_SERVICE_LINE,
  TIPO_COMPLETAR_LEARNING_PATH,
  TIPO_ATINGIR_NIVEL_LIDER,
  TIPO_ATINGIR_TOPO_GAMIFICATION,
  construirContexto,
  calcularProgresso,
};