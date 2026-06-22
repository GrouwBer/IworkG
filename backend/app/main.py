from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.models.provider import Provider
from app.models.client import Client
from app.models.category import Category
from app.models.review import Review
from app.models.service_request import ServiceRequest, Interest
from app.models.report import Report
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
