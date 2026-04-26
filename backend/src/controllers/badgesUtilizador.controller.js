const BadgeUtilizador = require('../model/BadgeUtilizador');
const BadgeRegular = require('../model/BadgeRegular');
const BadgeEspecial = require('../model/BadgeEspecial');
const Nivel = require('../model/Nivel');
const Area = require('../model/Area');
const ServiceLine = require('../model/ServiceLine');
const LearningPath = require('../model/LearningPath');
const Pontuacao = require('../model/Pontuacao');

//TODOS OS BADGES
//todos os badges do consultos -> regulares e especiais

exports.getTodosBadges = async (req, res) => {
  const idUtilizador = req.user.idUtilizador;

  try {
    const badges = await BadgeUtilizador.findAll({
      where: { idUtilizador },
      order: [['dataAtribuicao', 'DESC']],
    });

    // Para cada badge, vai buscar os dados do badge regular ou especial
    const resultado = await Promise.all(
      badges.map(async (bu) => {
        let nome = null;
        let urlImagem = null;
        let nomeNivel = null;
        let idNivel = null;
        let tipoNivel = null;
        let descricao = null;
        let pontos = null;
        let nomeServiceLine = null;
        let idServiceLine = null;
        let nomeArea = null;
        let idArea = null;

        if (bu.idBadgeRegular) {
          const br = await BadgeRegular.findOne({ where: { idBadgeRegular: bu.idBadgeRegular } });
          if (br) {
            nome = br.nomeBadge;
            urlImagem = br.urlImagemBadge;
            descricao = br.descricao;
            pontos = br.pontos;

            if (br.idNivel) {
              const nivel = await Nivel.findOne({ where: { idNivel: br.idNivel } });
              if (nivel) { nomeNivel = nivel.nomeNivel; idNivel = nivel.idNivel; tipoNivel = nivel.tipo; }
            }
            if (br.idServiceLine) {
              const sl = await ServiceLine.findOne({ where: { idServiceLine: br.idServiceLine } });
              if (sl) { nomeServiceLine = sl.nomeSl; idServiceLine = sl.idServiceLine; }
            }
            if (br.idArea) {
              const area = await Area.findOne({ where: { idArea: br.idArea } });
              if (area) { nomeArea = area.nomeArea; idArea = area.idArea; }
            }
          }
        } else if (bu.idBadgeEspecial) {
          const be = await BadgeEspecial.findOne({ where: { idBadgeEspecial: bu.idBadgeEspecial } });
          if (be) {
            nome = be.nomeBadgeEspecial;
            urlImagem = be.urlImagemEspecial;
            descricao = be.descricao;
            pontos = be.pontos;
            nomeNivel = 'Especial';
          }
        }

        return {
          id: bu.idBadgeUtilizador,
          idUtilizador: bu.idUtilizador,
          nomeBadge: nome,
          nomeNivel,
          idNivel,
          tipoNivel,
          urlImagem,
          descricao,
          pontos,
          nomeServiceLine,
          idServiceLine,
          nomeArea,
          idArea,
          dataAtribuicao: bu.dataAtribuicao,
          dataExpiracao: bu.dataExpiracao,
          valido: bu.valido === 1,
          urlPublico: bu.urlPublico,
          tokenValidacao: bu.tokenValidacao,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error('Erro nos badges:', err);
    res.status(500).json({ error: 'Erro ao carregar badges' });
  }
};