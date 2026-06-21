from pydantic import BaseModel


class ProviderSearchResult(BaseModel):
    """Schema retornado na listagem/busca de prestadores."""
    id: int
    nome: str
    foto_perfil: str | None
    categorias: list[str]
    media_avaliacao: float
    total_avaliacoes: int
    distancia_km: float
    disponivel: bool
    bio: str | None

    class Config:
        from_attributes = True


class ProviderSearchParams(BaseModel):
    """Parâmetros da busca de prestadores."""
    lat: float
    lng: float
    raio_km: int = 50
    categoria_id: int | None = None
    pagina: int = 1
    por_pagina: int = 20
