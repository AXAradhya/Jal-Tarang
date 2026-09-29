import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, ForeignKey, Index, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, FullAuditMixin, TimestampMixin


class User(Base, FullAuditMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="ACTIVE", nullable=False, index=True,
        doc="ACTIVE, INACTIVE, SUSPENDED, LOCKED, PENDING_VERIFICATION"
    )
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata", nullable=False)
    locale: Mapped[str] = mapped_column(String(20), default="en-IN", nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    credentials: Mapped[Optional["UserCredential"]] = relationship(
        "UserCredential", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole", back_populates="user", cascade="all, delete-orphan"
    )
    preferences: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notification_preferences: Mapped[List["UserNotificationPreference"]] = relationship(
        "UserNotificationPreference", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("uq_org_employee_code", "organization_id", "employee_code", unique=True),
    )


class UserCredential(Base, TimestampMixin):
    __tablename__ = "user_credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Argon2id password hash. Plaintext strictly prohibited."
    )
    password_salt: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    password_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lockout_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_history: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, doc="Array of last 5 previous password hashes to prevent re-use"
    )

    user: Mapped["User"] = relationship("User", back_populates="credentials")


class UserSession(Base, TimestampMixin):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_fingerprint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="session", cascade="all, delete-orphan"
    )


class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    replaced_by_token_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    session: Mapped["UserSession"] = relationship("UserSession", back_populates="refresh_tokens")


class PasswordResetToken(Base, TimestampMixin):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class EmailVerificationToken(Base, TimestampMixin):
    __tablename__ = "email_verification_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class LoginAttempt(Base, TimestampMixin):
    __tablename__ = "login_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_successful: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class UserDevice(Base, TimestampMixin):
    __tablename__ = "user_devices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    device_name: Mapped[str] = mapped_column(String(100), nullable=False)
    device_fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    device_type: Mapped[str] = mapped_column(String(50), default="DESKTOP", nullable=False)
    operating_system: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class UserSecurityEvent(Base, TimestampMixin):
    __tablename__ = "user_security_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        doc="PASSWORD_CHANGE, MFA_ENABLE, MFA_DISABLE, ACCOUNT_LOCKED, SESSION_REVOKED, SUSPICIOUS_IP"
    )
    severity: Mapped[str] = mapped_column(String(30), default="INFO", nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    theme: Mapped[str] = mapped_column(String(30), default="dark", nullable=False)
    default_dashboard: Mapped[str] = mapped_column(
        String(50), default="CHARTERING_COMMAND_CENTER", nullable=False
    )
    dashboard_layout: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    custom_filters: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="preferences")


class UserNotificationPreference(Base, TimestampMixin):
    __tablename__ = "user_notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_category: Mapped[str] = mapped_column(
        String(50), nullable=False,
        doc="FREIGHT_ALERT, CONGESTION_ALERT, FORECAST_UPDATE, APPROVAL_REQUEST, CONTRACT_EXPIRY"
    )
    channel: Mapped[str] = mapped_column(String(30), nullable=False, doc="IN_APP, EMAIL, SMS, WEBHOOK")
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    minimum_severity: Mapped[str] = mapped_column(String(30), default="LOW", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notification_preferences")

    __table_args__ = (
        Index("uq_user_notif_pref", "user_id", "notification_category", "channel", unique=True),
    )
