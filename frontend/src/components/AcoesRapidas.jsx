import { useNavigate } from 'react-router-dom'

export default function AcoesRapidas({ cards }) {
  const navigate = useNavigate()

  return (
    <section>
      <h2 className="acoes-rapidas-titulo">Ações Rápidas</h2>
      <div className="row g-3">
        {cards.map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div className="acoes-rapidas-card h-100">
              <p className="acoes-rapidas-descricao">{card.descricao}</p>
              <ul>
                {card.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
              <button
                className="auth-btn-primary acoes-rapidas-btn"
                onClick={() => card.path && navigate(card.path)}
              >
                {card.botao}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}