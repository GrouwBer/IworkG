from datetime import datetime, UTC
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class UserType(str, enum.Enum):
    CLIENT = "cliente"
    PROVIDER = "prestador"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    tipo: Mapped[UserType] = mapped_column(SAEnum(UserType), nullable=False)
    foto_perfil: Mapped[str | None] = mapped_column(String(500), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    ativo: Mapped[bool] = mapped_column(default=True)

    # Relacionamentos polimórficos: cada tipo de usuário tem seu perfil específico
    provider: Mapped["Provider | None"] = relationship("Provider", back_populates="user", uselist=False)
    client: Mapped["Client | None"] = relationship("Client", back_populates="user", uselist=False)
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="reviewer")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="reporter")

    def __repr__(self):
        return f"<User(id={self.id}, nome='{self.nome}', tipo={self.tipo})>"
