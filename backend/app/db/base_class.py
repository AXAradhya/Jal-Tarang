import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
        doc="Timestamp when record was created"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=datetime.now,
        nullable=False,
        doc="Timestamp when record was last updated"
    )


class AuditMixin(TimestampMixin):
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        doc="User ID who created the record"
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        doc="User ID who last updated the record"
    )


class SoftDeleteMixin:
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Soft deletion timestamp"
    )


class FullAuditMixin(AuditMixin, SoftDeleteMixin):
    """Combines timestamps, audit user stamps, and soft deletion."""
    pass
