// AuthLayout.jsx — Layout partilhado por todos os ecrãs de autenticação
// Divide o ecrã em dois painéis:
//   - Esquerda: painel azul com citação motivacional
//   - Direita: logo Softinsa + formulário (passado como children)
// O "children" é o que o React chama ao conteúdo que é passado entre as tags
// do componente — neste caso, o formulário específico de cada ecrã

const QUOTE = {
  text: 'Those people who develop the ability to continuously acquire new and better forms of knowledge that they can apply to their work and to their lives will be the movers and shakers in our society for the indefinite future',
  author: 'Brian Tracy',
}

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrapper">

      {/* Painel esquerdo — fundo azul com a citação */}
      <div className="auth-panel-left">
        <blockquote>
          <p>{QUOTE.text}</p>
          <footer>{QUOTE.author}</footer>
        </blockquote>
      </div>

      {/* Painel direito — logo e formulário */}
      <div className="auth-panel-right">
        <div className="auth-form-container">

          {/* Logo em texto — não depende de ficheiro de imagem externo */}
          <div className="auth-logo-text">
            <span className="logo-soft">SOFT</span>
            <span className="logo-insa">INSA</span>
          </div>

          {/* Aqui entra o formulário específico de cada ecrã */}
          {children}
        </div>
      </div>
    </div>
  )
}