// src/utils/pdfLogo.js
// Carrega o logótipo oficial da Softinsa (frontend/public/logo-softinsa.svg) e
// insere-o em qualquer PDF gerado com jsPDF. O jsPDF não lê SVG diretamente,
// por isso a imagem é convertida para PNG (via canvas) e fica em cache, para
// não ser recarregada a cada exportação.
//
// Uso (dentro de uma função async):
//   import { desenharLogoSoftinsa } from '../../utils/pdfLogo'
//   const doc = new jsPDF()
//   const y = await desenharLogoSoftinsa(doc)
//   // ...continuar a desenhar o resto do PDF a partir de "y"

let logoCache = null // null = ainda não tentou | undefined = tentou e falhou | objeto = carregado

function carregarImagemComoPNG(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 300
      canvas.height = img.naturalHeight || 100
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ dataUrl: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height })
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function obterLogo() {
  if (logoCache) return logoCache
  if (logoCache === undefined) return null // já tentou antes e falhou, não repete o pedido
  const resultado = await carregarImagemComoPNG('/logo-softinsa.svg')
  logoCache = resultado || undefined
  return resultado || null
}

// Desenha o logótipo no topo do PDF (com uma linha separadora por baixo) e
// devolve a posição Y sugerida para continuares a desenhar o resto do conteúdo.
export async function desenharLogoSoftinsa(doc, opcoes = {}) {
  const { x = 14, y = 10, altura = 10, comLinha = true } = opcoes
  const logo = await obterLogo()

  if (logo) {
    const largura = altura * logo.ratio
    try { doc.addImage(logo.dataUrl, 'PNG', x, y, largura, altura) } catch { /* ignora se a imagem for inválida */ }
  } else {
    // Recurso alternativo — texto estilizado, só usado se o ficheiro do logótipo não carregar
    doc.setFont(undefined, 'bold')
    doc.setFontSize(14)
    doc.setTextColor(57, 99, 156)
    doc.text('SOFT', x, y + altura - 2)
    const largSoft = doc.getTextWidth('SOFT')
    doc.setTextColor(17, 169, 214)
    doc.text('INSA', x + largSoft, y + altura - 2)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
  }

  const yLinha = y + altura + 4
  if (comLinha) {
    doc.setDrawColor(230, 230, 230)
    doc.line(x, yLinha, doc.internal.pageSize.getWidth() - x, yLinha)
  }
  return yLinha + 6
}
