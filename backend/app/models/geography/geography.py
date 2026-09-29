import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Index, DateTime, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, FullAuditMixin, TimestampMixin


class Continent(Base, TimestampMixin):
    __tablename__ = "continents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class Country(Base, TimestampMixin):
    __tablename__ = "countries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    iso2: Mapped[str] = mapped_column(String(2), unique=True, nullable=False, index=True)
    iso3: Mapped[str] = mapped_column(String(3), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    continent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("continents.id", ondelete="SET NULL"), nullable=True
    )
    un_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_maritime_nation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class CountryRegion(Base, TimestampMixin):
    __tablename__ = "country_regions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    region_code: Mapped[str] = mapped_column(String(50), nullable=False)
    region_name: Mapped[str] = mapped_column(String(150), nullable=False)

    __table_args__ = (
        Index("uq_country_region_code", "country_id", "region_code", unique=True),
    )


class StateRegion(Base, TimestampMixin):
    __tablename__ = "states_regions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    state_code: Mapped[str] = mapped_column(String(20), nullable=False)
    state_name: Mapped[str] = mapped_column(String(150), nullable=False)

    __table_args__ = (
        Index("uq_country_state_code", "country_id", "state_code", unique=True),
    )


class City(Base, TimestampMixin):
    __tablename__ = "cities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    state_region_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("states_regions.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    latitude: Mapped[Optional[Numeric]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[Numeric]] = mapped_column(Numeric(9, 6), nullable=True)


class PostalRegion(Base, TimestampMixin):
    __tablename__ = "postal_regions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False
    )
    postal_code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    region_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)


class GeographicalRegion(Base, TimestampMixin):
    __tablename__ = "geographical_regions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    region_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    region_name: Mapped[str] = mapped_column(String(150), nullable=False)
    region_type: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="MARITIME_OCEAN, SEA, STRAIT, BASIN, GULF, ECONOMIC_ZONE"
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class TimezoneMaster(Base, TimestampMixin):
    __tablename__ = "timezones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    timezone_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    utc_offset: Mapped[str] = mapped_column(String(10), nullable=False, doc="e.g. +05:30, +00:00")
    dst_offset: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)


class Currency(Base, TimestampMixin):
    __tablename__ = "currencies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False, index=True, doc="ISO 4217, e.g. USD, INR")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    decimal_places: Mapped[int] = mapped_column(default=2, nullable=False)


class CurrencyRate(Base, TimestampMixin):
    __tablename__ = "currency_rates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    from_currency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("currencies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    to_currency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("currencies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rate: Mapped[Numeric] = mapped_column(
        Numeric(18, 6), nullable=False, doc="Strict numeric exchange rate, never FLOAT"
    )
    rate_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), default="RBI_FED_REFERENCE", nullable=False)

    __table_args__ = (
        CheckConstraint("rate > 0", name="chk_currency_rate_positive"),
        Index("uq_curr_rate_pair_date", "from_currency_id", "to_currency_id", "rate_date", unique=True),
    )


class CurrencyRateHistory(Base, TimestampMixin):
    __tablename__ = "currency_rate_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    currency_rate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("currency_rates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rate: Mapped[Numeric] = mapped_column(Numeric(18, 6), nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    effective_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class UnitCategory(Base, TimestampMixin):
    __tablename__ = "unit_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False,
        doc="WEIGHT, VOLUME, DISTANCE, TIME, SPEED, MONETARY, RATE"
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Unit(Base, TimestampMixin):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unit_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    unit_code: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False, index=True,
        doc="e.g. MT, KG, TON, DWT, CBM, M3, USD, INR, USD/MT, USD/DAY, NM, KM, M, M/DAY, DAYS, HOURS"
    )
    unit_name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    is_standard_si: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class UnitConversion(Base, TimestampMixin):
    __tablename__ = "unit_conversions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    from_unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    to_unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    factor: Mapped[Numeric] = mapped_column(
        Numeric(18, 8), nullable=False, doc="Multiply from_unit by factor to get to_unit"
    )
    offset_value: Mapped[Numeric] = mapped_column(Numeric(18, 8), default=0, nullable=False)

    __table_args__ = (
        CheckConstraint("factor > 0", name="chk_unit_conv_factor_positive"),
        Index("uq_unit_conv_pair", "from_unit_id", "to_unit_id", unique=True),
    )
