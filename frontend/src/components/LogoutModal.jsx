import { IoClose } from 'react-icons/io5'

export default function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="logout-modal-overlay" onClick={onCancel}>
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-header">
          <p className="logout-modal-titulo">
            Tem a certeza que deseja terminar a sessão?
          </p>
          <button className="logout-modal-close" onClick={onCancel} aria-label="Fechar">
            <IoClose size={18} />
          </button>
        </div>

        <div className="logout-modal-acoes">
          <button className="logout-modal-cancelar" onClick={onCancel}>
            Cancelar
          </button>
          <button className="logout-modal-confirmar" onClick={onConfirm}>
            Terminar Sessão
          </button>
        </div>
      </div>
    </div>
  )
}