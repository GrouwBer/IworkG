from sqlalchemy import ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


# Favoritos: N:M entre Client e Provider
favorites = Table(
    "favorites",
    Base.metadata,
    Column("client_id", ForeignKey("clients.id"), primary_key=True),
    Column("provider_id", ForeignKey("providers.id"), primary_key=True),
)


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="client")
    favoritos: Mapped[list["Provider"]] = relationship("Provider", secondary=favorites)
    contatos: Mapped[list["ContactHistory"]] = relationship("ContactHistory", back_populates="client")

    def __repr__(self):
        return f"<Client(id={self.id}, user_id={self.user_id})>"


class ContactHistory(Base):
    """Histórico de contatos do cliente com prestadores (RF013)."""
    __tablename__ = "contact_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    # data do contato é gerenciada via default no schema

    client: Mapped["Client"] = relationship("Client", back_populates="contatos")
    provider: Mapped["Provider"] = relationship("Provider")
