from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class UrgencyLevel(str, enum.Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"


class RequestStatus(str, enum.Enum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"
    CANCELADO = "cancelado"


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    urgencia: Mapped[UrgencyLevel] = mapped_column(SAEnum(UrgencyLevel), default=UrgencyLevel.MEDIA)
    status: Mapped[RequestStatus] = mapped_column(SAEnum(RequestStatus), default=RequestStatus.ABERTO)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped["Client"] = relationship("Client")
    category: Mapped["Category"] = relationship("Category", back_populates="service_requests")
    interests: Mapped[list["Interest"]] = relationship("Interest", back_populates="service_request")


class Interest(Base):
    __tablename__ = "interests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    service_request_id: Mapped[int] = mapped_column(ForeignKey("service_requests.id"), nullable=False)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    service_request: Mapped["ServiceRequest"] = relationship("ServiceRequest", back_populates="interests")
    provider: Mapped["Provider"] = relationship("Provider")
