from datetime import datetime
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    nota: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 a 5
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resposta: Mapped[str | None] = mapped_column(Text, nullable=True)  # RF023

    reviewer: Mapped["User"] = relationship("User", back_populates="reviews")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="reviews")
