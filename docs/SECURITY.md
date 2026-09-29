# SAGAR DRISHTI — Security & Access Control Architecture

## 1. Authentication
- **Tokens**: Short-lived JSON Web Tokens (JWT) signed with HMAC-SHA256 / RSA.
- **Refresh Flow**: Refresh tokens stored securely in `refresh_tokens` table with rotation and single-use revocation.
- **Password Hashing**: Argon2id and BCrypt with high work factors.
- **Zero Plaintext**: Passwords and secrets are never logged or exposed in responses.

---

## 2. Role-Based Access Control (RBAC)
SAGAR DRISHTI enforces **EXACTLY SIX** application roles:

| Role | Domain Scope | Permissions |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Global Platform | Full unrestricted administrative rights, organization management, system settings. |
| **ADMIN** | Organization | User management, organization settings, notification preferences within own tenant. |
| **CHARTERING_MANAGER** | Maritime Logistics | Freight markets, vessel selection, voyage economics, charter fixtures, laytime. |
| **PROCUREMENT_MANAGER**| Cargo Sourcing | Bulk procurement plans, parcel requirements, contract approvals, supplier bidding. |
| **PORT_MANAGER** | Port Intelligence | Channel drafts, berth constraints, weather alerts, congestion, port turnaround. |
| **ANALYST** | Analytics & ML | Forecasting, market data ingestion, model evaluation, reports, backtesting. |

---

## 3. Tenant Isolation
Every database query in multi-tenant tables (`contracts`, `procurement_requirements`, `users`, `organization_settings`) enforces:
```sql
WHERE organization_id = $authContext.organizationId
```
Requests attempting to supply an arbitrary `organizationId` in the body/query cannot bypass this check; `organizationId` is strictly extracted from the cryptographically verified JWT payload.

---

## 4. Immutable Audit Trails
Critical state transitions (contract approval, fixture creation, user deactivation, recommendation approval) insert structured audit records into `audit_logs`:
- `userId`
- `organizationId`
- `action` (e.g., `CONTRACT_APPROVED`)
- `entityType`
- `entityId`
- `oldValue` (JSON snapshot)
- `newValue` (JSON snapshot)
- `timestamp`
