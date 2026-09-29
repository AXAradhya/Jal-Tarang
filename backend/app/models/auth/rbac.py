import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, FullAuditMixin, TimestampMixin


class Role(Base, FullAuditMixin):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    role_name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True,
        doc="Must be one of exactly 6 roles: SUPER_ADMIN, ADMIN, CHARTERING_MANAGER, PROCUREMENT_MANAGER, PORT_MANAGER, ANALYST"
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system_role: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
        doc="True for the 6 core seeded system roles"
    )

    # Relationships
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole", back_populates="role", cascade="all, delete-orphan"
    )


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    permission_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True,
        doc="Granular permission code following <domain>.<action>, e.g., freight.view, charter.approve"
    )
    domain: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(Base, TimestampMixin):
    __tablename__ = "role_permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="role_permissions")

    __table_args__ = (
        Index("uq_role_permission", "role_id", "permission_id", unique=True),
    )


class UserRole(Base, FullAuditMixin):
    __tablename__ = "user_roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="user_roles")
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")

    __table_args__ = (
        Index("uq_user_role_org", "user_id", "role_id", "organization_id", unique=True),
    )


class RoleHierarchy(Base, TimestampMixin):
    __tablename__ = "role_hierarchy"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    parent_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    child_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    hierarchy_depth: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        Index("uq_role_hierarchy", "parent_role_id", "child_role_id", unique=True),
    )
