from datetime import datetime, UTC
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.provider import provider_category


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icone: Mapped[str | None] = mapped_column(String(10), nullable=True)  # emoji
    descricao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))

    providers: Mapped[list["Provider"]] = relationship("Provider", secondary=provider_category, back_populates="categorias")
    service_requests: Mapped[list["ServiceRequest"]] = relationship("ServiceRequest", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, nome='{self.nome}')>"
