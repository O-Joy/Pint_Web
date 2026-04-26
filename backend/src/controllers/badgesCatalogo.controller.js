const BadgeRegular = require('../model/BadgeRegular');
const BadgeEspecial = require('../model/BadgeEspecial');
const Requisitos = require('../model/Requisitos');
const Nivel = require('../model/Nivel');
const Area = require('../model/Area');
const ServiceLine = require('../model/ServiceLine');
const LearningPath = require('../model/LearningPath');
const Consultor = require('../model/Consultor');
const BadgeUtilizador = require('../model/BadgeUtilizador');

//CATÁLOGO COMPLETO
// Devolve todos os badges ativos -> regulares e especiais e os requisitos

exports.getTodos = async (req, res) => {
  try {
    // Badges regulares
    const regulares = await BadgeRegular.findAll({
      where: { ativo: 1 },
      order: [['nomeBadge', 'ASC']],
    });

    // Badges especiais
    const especiais = await BadgeEspecial.findAll({
      where: { ativo: 1 },
      order: [['nomeBadgeEspecial', 'ASC']],
    });

    // Requisitos
    const requisitos = await Requisitos.findAll({
      order: [['idRequisito', 'ASC']],
    });

    // Formata os badges regulares com os dados que o Flutter espera no fromJson
    const regularesFormatados = await Promise.all(
      regulares.map(async (br) => {
        let nomeNivel = null;
        let nomeArea = null;
        let nomeServiceLine = null;
        let nomeLearningPath = null;

        if (br.idNivel) {
          const nivel = await Nivel.findOne({ where: { idNivel: br.idNivel } });
          if (nivel) nomeNivel = nivel.nomeNivel;
        }
        if (br.idArea) {
          const area = await Area.findOne({ where: { idArea: br.idArea } });
          if (area) nomeArea = area.nomeArea;
        }
        if (br.idServiceLine) {
          const sl = await ServiceLine.findOne({ where: { idServiceLine: br.idServiceLine } });
          if (sl) nomeServiceLine = sl.nomeSl;
        }
        if (br.idLearningPath) {
          const lp = await LearningPath.findOne({ where: { idLearningPath: br.idLearningPath } });
          if (lp) nomeLearningPath = lp.nomeLp;
        }

        return {
          id: br.idBadgeRegular,
          nome: br.nomeBadge,
          descricao: br.descricao,
          pontos: br.pontos,
          urlImagem: br.urlImagemBadge,
          validadeDias: br.validadeDias,
          idNivel: br.idNivel,
          nomeNivel,
          idServiceLine: br.idServiceLine,
          nomeServiceLine,
          idArea: br.idArea,
          nomeArea,
          idLearningPath: br.idLearningPath,
          nomeLearningPath,
        };
      })
    );

    // Formata os badges especiais
    const especiaisFormatados = especiais.map((be) => ({
      id: be.idBadgeEspecial,
      nome: be.nomeBadgeEspecial,
      descricao: be.descricao,
      pontos: be.pontos,
      validadeDias: be.validadeDias,
      urlImagem: be.urlImagemEspecial,
      idLearningPath: be.idLearningPath,
    }));

    // Formata os requisitos
    const requisitosFormatados = requisitos.map((r) => ({
      id: r.idRequisito,
      idBadgeRegular: r.idBadgeRegular,
      nome: r.nomeRequisito,
      descricao: r.descricao,
    }));

    res.json({
      regulares: regularesFormatados,
      especiais: especiaisFormatados,
      requisitos: requisitosFormatados,
    });
  } catch (err) {
    console.error('Erro no catálogo:', err);
    res.status(500).json({ error: 'Erro ao carregar catálogo' });
  }
};