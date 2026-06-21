import { useState, useEffect, useCallback } from 'react'
import ProviderCard from './components/ProviderCard.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import LocationBar from './components/LocationBar.jsx'
import './App.css'

const API_BASE = '/api'

function App() {
  const [providers, setProviders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState({ lat: -23.5505, lng: -46.6333 })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [radius, setRadius] = useState(20)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        lat: location.lat,
        lng: location.lng,
        raio_km: radius,
        por_pagina: 50,
      })
      if (selectedCategory) {
        params.set('categoria_id', selectedCategory)
      }

      const res = await fetch(`${API_BASE}/providers/search?${params}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setProviders(data)
    } catch (err) {
      setError('Não foi possível carregar os profissionais. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [location, selectedCategory, radius])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      // Categorias offline padrão
      setCategories([
        { id: 1, nome: 'Eletricista', icone: '⚡' },
        { id: 2, nome: 'Pedreiro', icone: '🧱' },
        { id: 3, nome: 'Encanador', icone: '🔧' },
        { id: 4, nome: 'Pintor', icone: '🎨' },
        { id: 5, nome: 'Jardineiro', icone: '🌿' },
      ])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (location.lat && location.lng) {
      fetchProviders()
    }
  }, [location, selectedCategory, radius, fetchProviders])

  // Tenta obter localização via GPS
  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          setError('Permita o acesso à localização ou digite um CEP.')
        }
      )
    }
  }

  const handleCepChange = async (cep) => {
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          // ViaCEP não retorna coordenadas — usamos Nominatim
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${data.logradouro},${data.localidade},${data.uf}`
          )
          const geoData = await geoRes.json()
          if (geoData.length > 0) {
            setLocation({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) })
          }
        }
      } catch {
        setError('CEP não encontrado.')
      }
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔨 IWork</h1>
        <p>Encontre o profissional ideal perto de você</p>
      </header>

      <LocationBar
        location={location}
        radius={radius}
        onGetLocation={handleGetLocation}
        onCepChange={handleCepChange}
        onRadiusChange={setRadius}
      />

      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <main className="provider-list">
        {loading && (
          <div className="loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-card" />
            ))}
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && providers.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>Nenhum profissional encontrado na sua região</p>
            <small>Tente aumentar o raio de busca ou mudar a categoria</small>
          </div>
        )}

        {!loading &&
          providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
      </main>
    </div>
  )
}

export default App
