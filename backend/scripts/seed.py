"""Script para popular dados de teste no banco."""
import sys
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserType
from app.models.provider import Provider
from app.models.category import Category

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Categorias — só insere se não existirem
cats_nomes = [
    ("Eletricista", "⚡", "Instalacoes e reparos eletricos"),
    ("Pedreiro", "🧱", "Construcao e alvenaria"),
    ("Encanador", "🔧", "Hidraulica e encanamento"),
    ("Pintor", "🎨", "Pintura residencial e comercial"),
    ("Jardineiro", "🌿", "Jardinagem e paisagismo"),
]
cats = []
for nome, icone, desc in cats_nomes:
    existing = db.query(Category).filter_by(nome=nome).first()
    if existing:
        cats.append(existing)
    else:
        cat = Category(nome=nome, icone=icone, descricao=desc)
        db.add(cat)
        db.flush()
        cats.append(cat)

db.commit()

providers_data = [
    {"nome": "Carlos Silva", "lat": -23.5505, "lon": -46.6333, "bio": "Eletricista ha 15 anos", "nota": 4.8, "reviews": 42, "cats": [0]},
    {"nome": "Maria Santos", "lat": -23.5610, "lon": -46.6560, "bio": "Instalacoes prediais", "nota": 4.5, "reviews": 28, "cats": [0]},
    {"nome": "Jose Pereira", "lat": -23.5400, "lon": -46.6200, "bio": "Pedreiro 20 anos", "nota": 4.9, "reviews": 67, "cats": [1]},
    {"nome": "Ana Oliveira", "lat": -23.5750, "lon": -46.6400, "bio": "Pintura artistica", "nota": 4.3, "reviews": 15, "cats": [3]},
    {"nome": "Joao Encanador", "lat": -23.5200, "lon": -46.6800, "bio": "Resolve vazamentos", "nota": 4.7, "reviews": 33, "cats": [2]},
    {"nome": "Pedro Jardim", "lat": -23.5900, "lon": -46.6100, "bio": "Paisagismo", "nota": 4.1, "reviews": 8, "cats": [4]},
    {"nome": "Far Away", "lat": -22.9000, "lon": -47.0600, "bio": "Muito longe", "nota": 5.0, "reviews": 1, "cats": [0]},
]

import uuid
for data in providers_data:
    email = f"{data['nome'].lower().replace(' ', '.')}@email.com"

    # Verifica se usuário já existe (por email)
    existing_user = db.query(User).filter_by(email=email).first()
    if existing_user:
        continue

    user = User(
        nome=data["nome"],
        email=email,
        telefone=f"119{uuid.uuid4().hex[:8]}",
        tipo=UserType.PROVIDER,
    )
    db.add(user)
    db.flush()

    provider = Provider(
        user_id=user.id, bio=data["bio"],
        latitude=data["lat"], longitude=data["lon"],
        media_avaliacao=data["nota"], total_avaliacao=data["reviews"],
        raio_atuacao_km=20,
    )
    db.add(provider)
    db.flush()

    for cat_idx in data["cats"]:
        provider.categorias.append(cats[cat_idx])

db.commit()
print(f"Criados {db.query(Provider).count()} prestadores com dados de teste")
db.close()
