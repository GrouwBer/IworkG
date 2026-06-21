"""
Rota de busca de prestadores (RF007, RF008).
GET /api/providers/search?lat=X&lng=Y&raio_km=Z&categoria_id=C
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.provider import Provider
from app.models.user import User
from app.schemas.provider import ProviderSearchResult
from app.services.geo import haversine_distance, compute_provider_score

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/search", response_model=list[ProviderSearchResult])
def search_providers(
    lat: float = Query(..., description="Latitude do cliente"),
    lng: float = Query(..., description="Longitude do cliente"),
    raio_km: int = Query(50, description="Raio máximo de busca em km"),
    categoria_id: int | None = Query(None, description="Filtrar por categoria"),
    pagina: int = Query(1, ge=1, description="Número da página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Resultados por página"),
    db: Session = Depends(get_db),
):
    """
    Busca prestadores próximos ao cliente, ordenados por score composto
    (distância + avaliação). Apenas prestadores disponíveis são retornados.
    """
    # Busca todos os prestadores disponíveis com dados relacionados
    query = (
        db.query(Provider)
        .options(joinedload(Provider.user), joinedload(Provider.categorias))
        .filter(Provider.disponivel == True)  # noqa: E712
    )

    if categoria_id is not None:
        query = query.filter(Provider.categorias.any(id=categoria_id))

    providers = query.all()

    # Calcula distância e score para cada prestador
    results = []
    for p in providers:
        if p.latitude is None or p.longitude is None:
            continue  # prestador sem localização cadastrada

        distancia = haversine_distance(lat, lng, p.latitude, p.longitude)

        # Filtra por raio de atuação do prestador e raio da busca
        if distancia > raio_km or distancia > p.raio_atuacao_km:
            continue

        score = compute_provider_score(distancia, p.media_avaliacao, p.total_avaliacoes)

        results.append({
            "provider": p,
            "distancia": distancia,
            "score": score,
        })

    # Ordena por score (maior = melhor)
    results.sort(key=lambda x: x["score"], reverse=True)

    # Paginação
    offset = (pagina - 1) * por_pagina
    page = results[offset : offset + por_pagina]

    return [
        ProviderSearchResult(
            id=r["provider"].id,
            nome=r["provider"].user.nome,
            foto_perfil=r["provider"].user.foto_perfil,
            categorias=[c.nome for c in r["provider"].categorias],
            media_avaliacao=round(r["provider"].media_avaliacao, 1),
            total_avaliacoes=r["provider"].total_avaliacoes,
            distancia_km=r["distancia"],
            disponivel=r["provider"].disponivel,
            bio=r["provider"].bio,
        )
        for r in page
    ]
