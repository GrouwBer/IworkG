from datetime import datetime, UTC
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Table, Column, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


# Tabela associativa N:M entre Provider e Category
provider_category = Table(
    "provider_category",
    Base.metadata,
    Column("provider_id", ForeignKey("providers.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    disponivel: Mapped[bool] = mapped_column(Boolean, default=True)
    raio_atuacao_km: Mapped[int] = mapped_column(Integer, default=15)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    media_avaliacao: Mapped[float] = mapped_column(Float, default=0.0)
    total_avaliacao: Mapped[int] = mapped_column(Integer, default=0)
    criado_em: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))

    __table_args__ = (
        Index("ix_providers_location", "latitude", "longitude"),
    )

    user: Mapped["User"] = relationship("User", back_populates="provider")
    categorias: Mapped[list["Category"]] = relationship("Category", secondary=provider_category, back_populates="providers")
    portfolio: Mapped[list["PortfolioItem"]] = relationship("PortfolioItem", back_populates="provider")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="provider")

    def __repr__(self):
        return f"<Provider(id={self.id}, disponivel={self.disponivel})>"


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    url_imagem: Mapped[str] = mapped_column(String(500), nullable=False)
    tag: Mapped[str] = mapped_column(String(20), default="geral")  # antes, depois, geral
    descricao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))

    provider: Mapped["Provider"] = relationship("Provider", back_populates="portfolio")
