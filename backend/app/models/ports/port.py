import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, Integer, ForeignKey, Index, DateTime, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography, Geometry

from app.db.base_class import Base, FullAuditMixin, TimestampMixin


class Port(Base, FullAuditMixin):
    __tablename__ = "ports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    official_name: Mapped[str] = mapped_column(String(200), nullable=False)
    un_locode: Mapped[str] = mapped_column(
        String(5), unique=True, nullable=False, index=True,
        doc="UN/LOCODE 5-character string, e.g., INPRT (Paradip), INVTZ (Visakhapatnam)"
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    latitude: Mapped[Numeric] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[Numeric] = mapped_column(Numeric(9, 6), nullable=False)
    location_geog = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True, index=True,
        doc="PostGIS WGS84 geography point for spatial radius and nearest-port queries"
    )
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata", nullable=False)
    port_type: Mapped[str] = mapped_column(
        String(50), default="MAJOR_SEA_PORT", nullable=False,
        doc="MAJOR_SEA_PORT, MINOR_PORT, RIVER_PORT, TRANSSHIPMENT_HUB, ANCHORAGE"
    )
    is_east_coast_india: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True,
        doc="Flags target SAIL import hubs: Paradip, Vizag, Gangavaram, Dhamra, Haldia, Gopalpur, Sagar"
    )
    status: Mapped[str] = mapped_column(String(30), default="OPERATIONAL", nullable=False, index=True)
    is_synthetic: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
        doc="Flag identifying synthetic or verified production data"
    )
    data_source_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Relationships
    aliases: Mapped[List["PortAlias"]] = relationship(
        "PortAlias", back_populates="port", cascade="all, delete-orphan"
    )
    codes: Mapped[List["PortCode"]] = relationship(
        "PortCode", back_populates="port", cascade="all, delete-orphan"
    )
    terminals: Mapped[List["PortTerminal"]] = relationship(
        "PortTerminal", back_populates="port", cascade="all, delete-orphan"
    )
    channels: Mapped[List["PortChannel"]] = relationship(
        "PortChannel", back_populates="port", cascade="all, delete-orphan"
    )
    anchorages: Mapped[List["PortAnchorageArea"]] = relationship(
        "PortAnchorageArea", back_populates="port", cascade="all, delete-orphan"
    )
    turning_basins: Mapped[List["PortTurningBasin"]] = relationship(
        "PortTurningBasin", back_populates="port", cascade="all, delete-orphan"
    )
    constraints: Mapped[List["PortConstraint"]] = relationship(
        "PortConstraint", back_populates="port", cascade="all, delete-orphan"
    )
    closures: Mapped[List["PortClosure"]] = relationship(
        "PortClosure", back_populates="port", cascade="all, delete-orphan"
    )


class PortAlias(Base, TimestampMixin):
    __tablename__ = "port_aliases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    alias_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    alias_type: Mapped[str] = mapped_column(String(50), default="LOCAL_SPELLING", nullable=False)


class PortCode(Base, TimestampMixin):
    __tablename__ = "port_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code_standard: Mapped[str] = mapped_column(String(30), nullable=False, doc="UN_LOCODE, CUSTOMS_CODE, EDI, SMDG")
    code_value: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    __table_args__ = (
        Index("uq_port_code_standard", "port_id", "code_standard", unique=True),
    )


class PortAuthority(Base, FullAuditMixin):
    __tablename__ = "port_authorities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    authority_name: Mapped[str] = mapped_column(String(200), nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vhf_channel: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, doc="Primary harbor VHF radio channel")


class PortContact(Base, TimestampMixin):
    __tablename__ = "port_contacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_role: Mapped[str] = mapped_column(String(50), nullable=False, doc="HARBOR_MASTER, PILOTAGE, BERTHING, CUSTOMS, AGENT")
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class PortDocument(Base, TimestampMixin):
    __tablename__ = "port_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False, doc="CIRCULAR, TARIFF_SCHEDULE, TIDE_TABLE, NAV_WARNING")
    file_uri: Mapped[str] = mapped_column(String(500), nullable=False)
    issued_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class PortTerminal(Base, FullAuditMixin):
    __tablename__ = "port_terminals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    terminal_code: Mapped[str] = mapped_column(String(50), nullable=False)
    terminal_name: Mapped[str] = mapped_column(String(150), nullable=False)
    terminal_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        doc="DRY_BULK, COAL_TERMINAL, IRON_ORE_BERTH, MULTI_PURPOSE, LIQUID, CONTAINER"
    )
    operator: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="OPERATIONAL", nullable=False)

    port: Mapped["Port"] = relationship("Port", back_populates="terminals")
    berths: Mapped[List["PortBerth"]] = relationship(
        "PortBerth", back_populates="terminal", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("uq_port_terminal_code", "port_id", "terminal_code", unique=True),
    )


class PortBerth(Base, FullAuditMixin):
    __tablename__ = "port_berths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    terminal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("port_terminals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    berth_code: Mapped[str] = mapped_column(String(50), nullable=False)
    berth_name: Mapped[str] = mapped_column(String(150), nullable=False)
    berth_length_m: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    design_draft_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    max_dwt_mt: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    bollard_pull_t: Mapped[Optional[Numeric]] = mapped_column(Numeric(8, 2), nullable=True)
    location_geog = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="OPERATIONAL", nullable=False)

    terminal: Mapped["PortTerminal"] = relationship("PortTerminal", back_populates="berths")
    equipment: Mapped[List["PortEquipment"]] = relationship(
        "PortEquipment", back_populates="berth", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("berth_length_m > 0", name="chk_berth_length_pos"),
        CheckConstraint("design_draft_m > 0", name="chk_berth_draft_pos"),
        CheckConstraint("max_dwt_mt > 0", name="chk_berth_dwt_pos"),
        Index("uq_terminal_berth_code", "terminal_id", "berth_code", unique=True),
    )


class PortChannel(Base, FullAuditMixin):
    __tablename__ = "port_channels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    channel_name: Mapped[str] = mapped_column(String(150), nullable=False)
    channel_type: Mapped[str] = mapped_column(String(50), default="APPROACH_CHANNEL", nullable=False)
    min_depth_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    width_m: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    length_nm: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    channel_geom = mapped_column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=True)
    is_tidal_dependent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    port: Mapped["Port"] = relationship("Port", back_populates="channels")


class PortAnchorageArea(Base, FullAuditMixin):
    __tablename__ = "port_anchorage_areas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    anchorage_name: Mapped[str] = mapped_column(String(150), nullable=False)
    anchorage_type: Mapped[str] = mapped_column(String(50), default="DEEP_WATER", nullable=False)
    min_depth_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    max_vessel_capacity: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    anchorage_geom = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)

    port: Mapped["Port"] = relationship("Port", back_populates="anchorages")


class PortTurningBasin(Base, FullAuditMixin):
    __tablename__ = "port_turning_basins"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    basin_name: Mapped[str] = mapped_column(String(150), nullable=False)
    diameter_m: Mapped[Numeric] = mapped_column(Numeric(8, 2), nullable=False)
    depth_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)

    port: Mapped["Port"] = relationship("Port", back_populates="turning_basins")


class PortStorageFacility(Base, FullAuditMixin):
    __tablename__ = "port_storage_facilities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    facility_name: Mapped[str] = mapped_column(String(150), nullable=False)
    facility_type: Mapped[str] = mapped_column(String(50), nullable=False, doc="OPEN_STOCKYARD, COVERED_SHED, SILO")
    capacity_mt: Mapped[Numeric] = mapped_column(Numeric(14, 2), nullable=False)
    cargo_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class PortEquipment(Base, FullAuditMixin):
    __tablename__ = "port_equipment"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    berth_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("port_berths.id", ondelete="CASCADE"), nullable=False, index=True
    )
    equipment_code: Mapped[str] = mapped_column(String(50), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False, doc="MOBILE_HARBOR_CRANE, SHIP_UNLOADER, CONVEYOR")
    handling_rate_tph: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, doc="Metric tons per hour nominal discharge rate")
    status: Mapped[str] = mapped_column(String(30), default="OPERATIONAL", nullable=False)

    berth: Mapped["PortBerth"] = relationship("PortBerth", back_populates="equipment")


class PortHandlingFacility(Base, TimestampMixin):
    __tablename__ = "port_handling_facilities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    facility_name: Mapped[str] = mapped_column(String(150), nullable=False)
    cargo_category: Mapped[str] = mapped_column(String(50), nullable=False, doc="COAL, IRON_ORE, LIMESTONE")
    discharge_rate_per_day_mt: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)


class PortOperatingHour(Base, TimestampMixin):
    __tablename__ = "port_operating_hours"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    operation_type: Mapped[str] = mapped_column(String(50), default="24_7_ALL_WEATHER", nullable=False)
    pilotage_available_night: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PortTidalWindow(Base, TimestampMixin):
    __tablename__ = "port_tidal_windows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    observation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    high_tide_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    high_tide_height_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    low_tide_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    low_tide_height_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)


class PortMaintenanceEvent(Base, FullAuditMixin):
    __tablename__ = "port_maintenance_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_title: Mapped[str] = mapped_column(String(200), nullable=False)
    maintenance_type: Mapped[str] = mapped_column(String(50), nullable=False, doc="DREDGING, BERTH_REPAIR, CRANE_OVERHAUL")
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    impact_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PortClosure(Base, FullAuditMixin):
    __tablename__ = "port_closures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    closure_reason: Mapped[str] = mapped_column(String(100), nullable=False, doc="CYCLONE, SWELL, STRIKE, CANAL_BLOCKAGE, SECURITY")
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    expected_reopen_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_reopen_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    severity: Mapped[str] = mapped_column(String(30), default="HIGH", nullable=False)

    port: Mapped["Port"] = relationship("Port", back_populates="closures")


class PortWeatherConstraint(Base, TimestampMixin):
    __tablename__ = "port_weather_constraints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    max_wind_speed_knots: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    max_swell_height_m: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    min_visibility_nm: Mapped[Numeric] = mapped_column(Numeric(6, 2), nullable=False)
    monsoon_restrictions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PortConstraint(Base, FullAuditMixin):
    __tablename__ = "port_constraints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    port_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    terminal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("port_terminals.id", ondelete="CASCADE"), nullable=True, index=True
    )
    berth_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("port_berths.id", ondelete="CASCADE"), nullable=True, index=True
    )
    constraint_name: Mapped[str] = mapped_column(String(150), nullable=False)
    constraint_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        doc="DRAFT, LOA, BEAM, AIR_DRAFT, DWT, GT, CARGO_RESTRICTION"
    )
    max_loa_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(8, 2), nullable=True)
    min_loa_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(8, 2), nullable=True)
    max_beam_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(8, 2), nullable=True)
    max_draft_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(6, 2), nullable=True)
    min_draft_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(6, 2), nullable=True)
    channel_draft_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(6, 2), nullable=True)
    berth_draft_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(6, 2), nullable=True)
    max_air_draft_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(6, 2), nullable=True)
    max_dwt_mt: Mapped[Optional[Numeric]] = mapped_column(Numeric(12, 2), nullable=True)
    max_gt_mt: Mapped[Optional[Numeric]] = mapped_column(Numeric(12, 2), nullable=True)
    turning_radius_m: Mapped[Optional[Numeric]] = mapped_column(Numeric(8, 2), nullable=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    port: Mapped["Port"] = relationship("Port", back_populates="constraints")

    __table_args__ = (
        CheckConstraint("valid_to IS NULL OR valid_to > valid_from", name="chk_port_constraint_validity_window"),
    )
