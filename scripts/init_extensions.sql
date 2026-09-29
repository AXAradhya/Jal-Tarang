-- ============================================================================
-- SAIL MARINEX - DATABASE EXTENSIONS SETUP
-- Ministry of Steel / Steel Authority of India Limited (SAIL)
-- Problem Statement: SIH 26006
-- Target Database: PostgreSQL 16+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Set standard timezone to UTC for server sessions
SET timezone = 'UTC';
