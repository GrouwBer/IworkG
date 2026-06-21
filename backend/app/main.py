from fastapi import FastAPI
from app.database import engine, Base
from app.models import *  # noqa: F401,F403 — registra todos os modelos
from app.routes import providers

# Cria tabelas no banco (SQLite — em produção usar Alembic/migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IWork MVP API",
    description="Marketplace de serviços locais — Backend",
    version="1.0.0",
)

app.include_router(providers.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "IWork MVP API"}
