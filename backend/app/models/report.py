from datetime import datetime, UTC
from sqlalchemy import String, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class ReportReason(str, enum.Enum):
    PERFIL_FALSO = "perfil_falso"
    COMPORTAMENTO = "comportamento_inadequado"
    GOLPE = "golpe"
    OUTRO = "outro"


class ReportStatus(str, enum.Enum):
    PENDENTE = "pendente"
    ANALISADA = "analisada"
    RESOLVIDA = "resolvida"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    reported_provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    motivo: Mapped[ReportReason] = mapped_column(SAEnum(ReportReason), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(SAEnum(ReportStatus), default=ReportStatus.PENDENTE)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    reporter: Mapped["User"] = relationship("User", back_populates="reports")
    reported_provider: Mapped["Provider"] = relationship("Provider")
