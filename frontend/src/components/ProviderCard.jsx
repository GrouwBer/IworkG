import { useState } from 'react'

const CATEGORY_ICONS = {
  'Eletricista': '⚡',
  'Pedreiro': '🧱',
  'Encanador': '🔧',
  'Pintor': '🎨',
  'Jardineiro': '🌿',
}

function ProviderCard({ provider }) {
  const [expanded, setExpanded] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const renderStars = (rating) => {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    const empty = 5 - full - (half ? 1 : 0)
    return (
      '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
    )
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleWhatsApp = () => {
    // No MVP, placeholder — será integrado com o número real do prestador
    alert(`Em breve: contato com ${provider.nome} via WhatsApp`)
  }

  const handleCall = () => {
    alert(`Em breve: ligar para ${provider.nome}`)
  }

  return (
    <div className={`provider-card ${expanded ? 'expanded' : ''}`}>
      <div className="card-main" onClick={() => setExpanded(!expanded)}>
        <div className="card-avatar">
          {provider.foto_perfil ? (
            <img src={provider.foto_perfil} alt={provider.nome} />
          ) : (
            <div className="avatar-placeholder">{getInitials(provider.nome)}</div>
          )}
        </div>

        <div className="card-info">
          <div className="card-header">
            <h3>{provider.nome}</h3>
            <button
              className={`fav-btn ${favorited ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setFavorited(!favorited)
              }}
              aria-label={favorited ? 'Remover dos favoritos' : 'Favoritar'}
            >
              {favorited ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="card-categories">
            {provider.categorias.map((cat) => (
              <span key={cat} className="chip">
                {CATEGORY_ICONS[cat] || '🔹'} {cat}
              </span>
            ))}
          </div>

          <div className="card-meta">
            <span className="rating" title={`${provider.media_avaliacao} de 5 estrelas`}>
              {renderStars(provider.media_avaliacao)}{' '}
              <small>({provider.total_avaliacoes})</small>
            </span>
            <span className="distance">{provider.distancia_km} km</span>
          </div>
        </div>

        <div className="card-arrow">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="card-details">
          {provider.bio && <p className="bio">{provider.bio}</p>}

          <div className="card-actions">
            <button className="btn btn-primary" onClick={handleWhatsApp}>
              💬 WhatsApp
            </button>
            <button className="btn btn-secondary" onClick={handleCall}>
              📞 Ligar
            </button>
          </div>

          <button
            className="btn btn-report"
            onClick={(e) => {
              e.stopPropagation()
              alert('Denúncia registrada. Nossa equipe irá analisar.')
            }}
          >
            🚩 Denunciar
          </button>
        </div>
      )}
    </div>
  )
}

export default ProviderCard
