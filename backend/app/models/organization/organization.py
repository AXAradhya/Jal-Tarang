import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, FullAuditMixin, TimestampMixin


class Organization(Base, FullAuditMixin):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True,
        doc="Unique business code for organization, e.g., SAIL-HQ, SAIL-BSP"
    )
    legal_name: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="Full legal registered entity name"
    )
    display_name: Mapped[str] = mapped_column(
        String(150), nullable=False, doc="Short display name"
    )
    organization_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ENTERPRISE",
        doc="Type: ENTERPRISE, SUBSIDIARY, PLANT, PORT_OFFICE, CHARTERER"
    )
    industry: Mapped[str] = mapped_column(
        String(100), default="Steel & Maritime Logistics", nullable=False
    )
    country_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="SET NULL"), nullable=True
    )
    default_currency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("currencies.id", ondelete="SET NULL"), nullable=True
    )
    timezone: Mapped[str] = mapped_column(
        String(50), default="Asia/Kolkata", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(30), default="ACTIVE", nullable=False, index=True
    )

    # Relationships
    settings: Mapped[List["OrganizationSetting"]] = relationship(
        "OrganizationSetting", back_populates="organization", cascade="all, delete-orphan"
    )
    business_units: Mapped[List["OrganizationBusinessUnit"]] = relationship(
        "OrganizationBusinessUnit", back_populates="organization", cascade="all, delete-orphan"
    )
    departments: Mapped[List["Department"]] = relationship(
        "Department", back_populates="organization", cascade="all, delete-orphan"
    )
    locations: Mapped[List["Location"]] = relationship(
        "Location", back_populates="organization", cascade="all, delete-orphan"
    )
    cost_centers: Mapped[List["CostCenter"]] = relationship(
        "CostCenter", back_populates="organization", cascade="all, delete-orphan"
    )
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="organization"
    )
    data_policies: Mapped[List["OrganizationDataPolicy"]] = relationship(
        "OrganizationDataPolicy", back_populates="organization", cascade="all, delete-orphan"
    )
    feature_flags: Mapped[List["OrganizationFeatureFlag"]] = relationship(
        "OrganizationFeatureFlag", back_populates="organization", cascade="all, delete-orphan"
    )


class OrganizationSetting(Base, TimestampMixin):
    __tablename__ = "organization_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    setting_key: Mapped[str] = mapped_column(String(100), nullable=False)
    setting_value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="settings")

    __table_args__ = (
        Index("uq_org_settings_key", "organization_id", "setting_key", unique=True),
    )


class OrganizationAddress(Base, FullAuditMixin):
    __tablename__ = "organization_addresses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    address_type: Mapped[str] = mapped_column(
        String(50), default="HEADQUARTERS", nullable=False,
        doc="HEADQUARTERS, BRANCH, PORT_OFFICE, BILLING, SHIPPING"
    )
    street_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    street_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(30), nullable=False)
    country_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="SET NULL"), nullable=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class OrganizationContact(Base, FullAuditMixin):
    __tablename__ = "organization_contacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_type: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="PRIMARY, OPERATIONS, LEGAL, FINANCE, EMERGENCY"
    )
    contact_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class OrganizationBusinessUnit(Base, FullAuditMixin):
    __tablename__ = "organization_business_units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    unit_code: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="business_units")

    __table_args__ = (
        Index("uq_org_bu_code", "organization_id", "unit_code", unique=True),
    )


class Department(Base, FullAuditMixin):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    business_unit_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organization_business_units.id", ondelete="SET NULL"), nullable=True
    )
    department_code: Mapped[str] = mapped_column(String(50), nullable=False)
    department_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="departments")
    teams: Mapped[List["Team"]] = relationship("Team", back_populates="department", cascade="all, delete-orphan")

    __table_args__ = (
        Index("uq_org_dept_code", "organization_id", "department_code", unique=True),
    )


class Team(Base, FullAuditMixin):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    team_code: Mapped[str] = mapped_column(String(50), nullable=False)
    team_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)

    department: Mapped["Department"] = relationship("Department", back_populates="teams")

    __table_args__ = (
        Index("uq_dept_team_code", "department_id", "team_code", unique=True),
    )


class Location(Base, FullAuditMixin):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    location_code: Mapped[str] = mapped_column(String(50), nullable=False)
    location_name: Mapped[str] = mapped_column(String(150), nullable=False)
    location_type: Mapped[str] = mapped_column(String(50), nullable=False, doc="HEADQUARTERS, PLANT, PORT_OFFICE, WAREHOUSE")
    port_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="locations")


class CostCenter(Base, FullAuditMixin):
    __tablename__ = "cost_centers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cost_center_code: Mapped[str] = mapped_column(String(50), nullable=False)
    cost_center_name: Mapped[str] = mapped_column(String(150), nullable=False)
    currency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("currencies.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="cost_centers")

    __table_args__ = (
        Index("uq_org_cost_center", "organization_id", "cost_center_code", unique=True),
    )


class OrganizationDataPolicy(Base, TimestampMixin):
    __tablename__ = "organization_data_policies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    policy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    retention_days: Mapped[int] = mapped_column(default=3650, nullable=False, doc="10 years default retention")
    allow_cross_org_analytics: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    require_mfa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enforce_ip_whitelist: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ip_whitelist: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="data_policies")


class OrganizationFeatureFlag(Base, TimestampMixin):
    __tablename__ = "organization_feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature_key: Mapped[str] = mapped_column(String(100), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rules: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="feature_flags")

    __table_args__ = (
        Index("uq_org_feature_flag", "organization_id", "feature_key", unique=True),
    )
