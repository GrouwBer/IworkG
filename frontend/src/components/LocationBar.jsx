import { useState } from 'react'

function LocationBar({ location, radius, onGetLocation, onCepChange, onRadiusChange }) {
  const [cep, setCep] = useState('')
  const [mode, setMode] = useState('gps') // gps | cep

  const handleCepInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setCep(value)
    if (value.length === 8) {
      onCepChange(value)
    }
  }

  return (
    <div className="location-bar">
      <div className="location-tabs">
        <button
          className={`tab ${mode === 'gps' ? 'active' : ''}`}
          onClick={() => setMode('gps')}
        >
          📍 GPS
        </button>
        <button
          className={`tab ${mode === 'cep' ? 'active' : ''}`}
          onClick={() => setMode('cep')}
        >
          📮 CEP
        </button>
      </div>

      {mode === 'gps' ? (
        <button className="btn btn-gps" onClick={onGetLocation}>
          🎯 Usar minha localização
        </button>
      ) : (
        <input
          type="text"
          className="cep-input"
          placeholder="Digite seu CEP (ex: 01310100)"
          value={cep}
          onChange={handleCepInput}
          maxLength={8}
        />
      )}

      <div className="radius-control">
        <label>Raio: {radius} km</label>
        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <div className="radius-labels">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      {location.lat && (
        <small className="location-info">
          Buscando em: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </small>
      )}
    </div>
  )
}

export default LocationBar
