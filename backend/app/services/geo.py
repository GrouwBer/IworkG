"""
Serviço de geolocalização — cálculo de distância usando a fórmula de Haversine.
"""

import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância em quilômetros entre dois pontos geográficos
    usando a fórmula de Haversine.

    Args:
        lat1, lon1: coordenadas do ponto 1 (cliente)
        lat2, lon2: coordenadas do ponto 2 (prestador)

    Returns:
        Distância em km (float, arredondado para 1 casa decimal)
    """
    R = 6371.0  # raio da Terra em km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 1)


def compute_provider_score(distance_km: float, rating: float, total_reviews: int) -> float:
    """
    Calcula um score composto para ordenação dos prestadores.
    Combina distância (peso 0.6) e avaliação (peso 0.4),
    com ajuste bayesiano para poucas avaliações.

    Args:
        distance_km: distância do prestador ao cliente
        rating: média de avaliações (0 a 5)
        total_reviews: número total de avaliações

    Returns:
        Score composto (maior = melhor)
    """
    # Normaliza distância: 0 km → 1.0, 50 km → 0.0
    distance_score = max(0.0, 1.0 - (distance_km / 50.0))

    # Ajuste bayesiano: prior de 3.0 com peso 5 (evita que 1 avaliação 5.0 vença 100 avaliações 4.8)
    bayesian_rating = (rating * total_reviews + 3.0 * 5) / (total_reviews + 5) if total_reviews > 0 else 3.0
    rating_score = bayesian_rating / 5.0

    return round(0.6 * distance_score + 0.4 * rating_score, 3)
