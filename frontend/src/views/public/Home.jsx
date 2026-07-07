import { useState, useEffect } from 'react'
import PublicLayout from '../../components/PublicLayout'
import CardBadgePublico from '../../components/CardBadgePublico'
import CardConsultorPublico from '../../components/CardConsultorPublico'
import api from '../../services/api'
import { FiSearch, FiCheckCircle, FiShield, FiTrendingUp, FiTarget, FiUsers, FiAward } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'

export default function PublicHome() {
  const [destaques, setDestaques] = useState([])
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/public/destaques'),
      api.get('/public/recentes'),
    ]).then(([d, r]) => {
      setDestaques(Array.isArray(d.data) ? d.data : [])
      setRecentes(Array.isArray(r.data) ? r.data : [])
    }).catch(err => console.error('[PublicHome] ERRO:', err.response?.data || err.message))
      .finally(() => setLoading(false))
  }, [])

  function pesquisarEIr(e) {
    e.preventDefault()
    if(pesquisa.trim()) {
      navigate(`/explorar?q=${encodeURIComponent(pesquisa)}`)
    }
  }

  return (
    <PublicLayout>
      
      {/* ── 1. Hero Section (Assimétrica e Corporativa) ── */}
      <div className="bg-white border-bottom py-5 overflow-hidden">
        <div className="container py-lg-5" style={{ maxWidth: 1200 }}>
          <div className="row align-items-center g-5">
            
            {/* Lado Esquerdo: Copywriting e Pesquisa */}
            <div className="col-lg-6 text-start z-1">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ background: '#eef3fa', border: '1px solid #dbeeff' }}>
                <FiShield className="text-primary" size={16} />
                <span className="fw-medium text-primary" style={{ fontSize: 13, letterSpacing: '0.5px' }}>CERTIFICAÇÃO OFICIAL SOFTINSA</span>
              </div>
              
              <h1 className="fw-bolder mb-4" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: '#1a1a2e', lineHeight: 1.1, letterSpacing: '-1px' }}>
                Valide o Talento. <br />
                <span style={{ color: '#39639C' }}>Impulsione o Futuro.</span>
              </h1>
              
              <p className="text-secondary mb-5" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 500 }}>
                Acelere o crescimento da sua organização numa economia baseada em competências reais. Descubra e verifique as credenciais digitais dos nossos consultores.
              </p>
              
              <form onSubmit={pesquisarEIr} className="position-relative" style={{ maxWidth: 500 }}>
                <div className="input-group bg-white rounded-pill overflow-hidden p-1 shadow-sm" style={{ border: '1px solid #ced4da', transition: 'box-shadow 0.3s' }}>
                  <span className="input-group-text bg-transparent border-0 ps-4 pe-2">
                    <FiSearch className="text-secondary" size={20} />
                  </span>
                  <input
                    className="form-control border-0 py-3 px-2 shadow-none bg-transparent"
                    placeholder="Pesquisar por token, badge ou consultor..."
                    value={pesquisa}
                    onChange={e => setPesquisa(e.target.value)}
                    style={{ fontSize: 15 }}
                  />
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-medium m-1" style={{ background: '#39639C', border: 'none' }}>
                    Verificar
                  </button>
                </div>
              </form>
            </div>

            {/* Lado Direito: Composição Visual com Cartões Flutuantes */}
            <div className="col-lg-6 position-relative d-none d-lg-block">
              <div className="rounded-4 position-relative mx-auto" style={{ height: 460, width: '90%', background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)', border: '1px solid #e2e8f0' }}>
                {/* Elementos Decorativos */}
                <div className="position-absolute bg-white rounded-circle" style={{ width: 400, height: 400, top: -50, right: -100, opacity: 0.4, filter: 'blur(40px)' }} />
                <div className="position-absolute rounded-circle" style={{ width: 300, height: 300, bottom: -50, left: -50, background: '#11a9d6', opacity: 0.1, filter: 'blur(40px)' }} />
                
                <img 
                  src="/heroimage" 
                  alt="Profissional Softinsa" 
                  className="w-100 h-100 object-fit-cover rounded-4 opacity-100"
                  style={{ mixBlendMode: 'multiply' }}
                />

                {/* Cartão UI Flutuante 1 */}
                <div className="position-absolute bg-white p-3 rounded-4 shadow" style={{ bottom: 40, left: -40, width: 260, border: '1px solid rgba(0,0,0,0.05)', animation: 'float 6s ease-in-out infinite' }}>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: 44, height: 44, background: '#eef3fa', color: '#39639C' }}>
                      <FiAward size={22} />
                    </div>
                    <div>
                      <p className="mb-0 fw-bold" style={{ fontSize: 14, color: '#1a1a2e' }}>Especialista LowCode</p>
                      <p className="mb-0 text-success d-flex align-items-center gap-1" style={{ fontSize: 11, fontWeight: 600 }}>
                        <FiCheckCircle size={12}/> Verificado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cartão UI Flutuante 2 */}
                {/* Cartão UI Flutuante 2 (Gamification em vez de Consultor) */}
                <div className="position-absolute bg-white p-3 rounded-4 shadow" style={{ top: 60, right: -30, width: 220, border: '1px solid rgba(0,0,0,0.05)', animation: 'float 5s ease-in-out infinite alternate' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex justify-content-center align-items-center bg-light border" style={{ width: 40, height: 40, color: '#2E7D32' }}>
                        <FiTrendingUp size={20} />
                    </div>
                    <div>
                      <p className="mb-0 fw-bold" style={{ fontSize: 14, color: '#1a1a2e' }}>+150 Pontos</p>
                      <p className="mb-0 text-secondary" style={{ fontSize: 11 }}>Nível Desbloqueado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Barra de Confiança (Social Proof) ── */}
      <div className="border-bottom bg-light py-4">
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="row text-center g-4">
            <div className="col-4 border-end">
              <div className="fw-bolder text-primary mb-1" style={{ fontSize: 28 }}>100%</div>
              <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: 11, letterSpacing: '1px' }}>Auditoria Rigorosa</div>
            </div>
            <div className="col-4 border-end">
              <div className="fw-bolder text-primary mb-1" style={{ fontSize: 28 }}>+15</div>
              <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: 11, letterSpacing: '1px' }}>Service Lines</div>
            </div>
            <div className="col-4">
              <div className="fw-bolder text-primary mb-1" style={{ fontSize: 28 }}>24/7</div>
              <div className="text-secondary fw-semibold text-uppercase" style={{ fontSize: 11, letterSpacing: '1px' }}>Validação Global</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Secção: Pilares de Crescimento ── */}
      <div className="bg-white py-5">
        <div className="container py-4" style={{ maxWidth: 1100 }}>
          <div className="text-center mb-5">
            <h2 className="fw-bolder mb-3" style={{ fontSize: 32, color: '#1a1a2e', letterSpacing: '-0.5px' }}>Alinhados com o Futuro</h2>
            <p className="text-secondary mx-auto" style={{ maxWidth: 600, fontSize: 16 }}>
              Uma plataforma desenhada para conectar equipas e evidenciar as competências reais que fazem crescer o nosso negócio.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 shadow-sm" style={{ background: '#f8fafc', borderRadius: 20 }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4" style={{ width: 56, height: 56, background: '#eef3fa', color: '#39639C' }}>
                  <FiTrendingUp size={24} />
                </div>
                <h5 className="fw-bold mb-2 text-dark" style={{ fontSize: 18 }}>Learning Paths</h5>
                <p className="text-secondary mb-0" style={{ fontSize: 14, lineHeight: 1.6 }}>Progressão estruturada por Service Lines com níveis claros de evolução técnica e profissional.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 shadow-sm" style={{ background: '#f8fafc', borderRadius: 20 }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4" style={{ width: 56, height: 56, background: '#e2f6fc', color: '#11a9d6' }}>
                  <FiTarget size={24} />
                </div>
                <h5 className="fw-bold mb-2 text-dark" style={{ fontSize: 18 }}>Gamification Ativo</h5>
                <p className="text-secondary mb-0" style={{ fontSize: 14, lineHeight: 1.6 }}>Um sistema rigoroso de pontos e conquistas que motiva e recompensa a aprendizagem contínua.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 shadow-sm" style={{ background: '#f8fafc', borderRadius: 20 }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-4" style={{ width: 56, height: 56, background: '#eefaf2', color: '#2E7D32' }}>
                  <FiUsers size={24} />
                </div>
                <h5 className="fw-bold mb-2 text-dark" style={{ fontSize: 18 }}>Talento Verificável</h5>
                <p className="text-secondary mb-0" style={{ fontSize: 14, lineHeight: 1.6 }}>Credenciais padronizadas e transparentes, prontas para partilha corporativa e em redes profissionais.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Catálogo Público (Destaques e Recentes) ── */}
      <div className="py-5" style={{ background: '#f4f7fa' }}>
        <div className="container pb-5" style={{ maxWidth: 1100 }}>

          {/* Destaques */}
          <div className="d-flex justify-content-between align-items-end mb-4 pt-3">
            <div>
              <h3 className="fw-bolder mb-1" style={{ fontSize: 24, color: '#1a1a2e', letterSpacing: '-0.5px' }}>Catálogo de Badges</h3>
              <p className="text-secondary mb-0 small">As certificações mais procuradas na Softinsa</p>
            </div>
            <Link to="/explorar" className="btn btn-outline-primary btn-sm fw-medium px-3 rounded-pill bg-white">Ver Catálogo</Link>
          </div>

          {loading ? (
            <p className="text-secondary text-center py-5">A carregar catálogo...</p>
          ) : destaques.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 border">
              <FiAward size={32} className="text-secondary mb-3 opacity-50" />
              <h6 className="fw-bold text-dark">Nenhum badge em destaque</h6>
              <p className="text-secondary small mb-0">O catálogo está a ser atualizado. Volte em breve.</p>
            </div>
          ) : (
            <div className="row g-4 mb-5">
              {destaques.map((b) => (
                <div key={b.idBadgeRegular} className="col-md-6 col-lg-3">
                  <CardBadgePublico badge={b} onInfo={() => setSelecionado(b)} />
                </div>
              ))}
            </div>
          )}

          {/* Recentes */}
          <div className="d-flex justify-content-between align-items-end mb-4 pt-4 mt-2 border-top border-light">
            <div>
              <h3 className="fw-bolder mb-1" style={{ fontSize: 24, color: '#1a1a2e', letterSpacing: '-0.5px' }}>Atribuições Recentes</h3>
              <p className="text-secondary mb-0 small">Talentos recém-certificados pela nossa equipa</p>
            </div>
            <Link to="/consultores-certificados" className="btn btn-outline-primary btn-sm fw-medium px-3 rounded-pill bg-white">Ver Consultores</Link>
          </div>

          {loading ? (
            <p className="text-secondary text-center py-5">A carregar consultores...</p>
          ) : recentes.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 border">
              <FiCheckCircle size={32} className="text-secondary mb-3 opacity-50" />
              <h6 className="fw-bold text-dark">Sem certificações recentes</h6>
              <p className="text-secondary small mb-0">As novas emissões aparecerão aqui.</p>
            </div>
          ) : (
            <div className="row g-4">
              {recentes.map((c, i) => (
                <div key={i} className="col-md-6 col-lg-3">
                  <CardConsultorPublico consultor={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Informação (Limpo e Minimalista) ── */}
      {selecionado && (
        <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(4px)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} onClick={() => setSelecionado(null)}>
          <div className="bg-white rounded-4 p-4 shadow-lg position-relative" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: '90%' }}>
            <button onClick={() => setSelecionado(null)} className="btn-close position-absolute top-0 end-0 m-3" aria-label="Close"></button>
            <div className="d-flex align-items-center gap-3 mb-4 mt-2">
              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 56, height: 56, background: '#eef3fa', color: '#39639C' }}>
                <FiAward size={28} />
              </div>
              <div>
                <div className="fw-bolder text-dark" style={{ fontSize: 18, letterSpacing: '-0.3px' }}>{selecionado.nomeBadge}</div>
                <span className="badge rounded-pill bg-light text-primary border mt-1 px-2 py-1" style={{ fontSize: 11, fontWeight: 600 }}>{selecionado.nomeNivel}</span>
              </div>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: 14, lineHeight: 1.6 }}>{selecionado.descricao || 'Este badge certifica competências específicas nos nossos Learning Paths.'}</p>
            
            <div className="bg-light rounded-3 p-3 mb-4 border">
               <div className="d-flex justify-content-between mb-2">
                 <span className="text-secondary" style={{ fontSize: 12 }}>Área / Service Line</span>
                 <span className="fw-medium text-dark text-end" style={{ fontSize: 12 }}>{[selecionado.nomeServiceLine, selecionado.nomeArea].filter(Boolean).join(' · ')}</span>
               </div>
               <div className="d-flex justify-content-between">
                 <span className="text-secondary" style={{ fontSize: 12 }}>Profissionais Certificados</span>
                 <span className="fw-bold text-primary" style={{ fontSize: 12 }}>{selecionado.totalConsultores}</span>
               </div>
            </div>
            <Link to="/explorar" className="btn w-100 fw-medium rounded-pill py-2" style={{ background: '#39639C', color: '#fff' }}>Ver Detalhes no Catálogo</Link>
          </div>
        </div>
      )}

      {/* Estilos inline para as animações flutuantes da imagem */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </PublicLayout>
  )
}