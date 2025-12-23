# UMSafe System Complexities

Below are three key complexities in UMSafe, each documented with its Complexity, Impact, and Implemented solution. No code is included here — this is a conceptual and architectural summary suitable for lecture or assessment.

## 1) JWT Authentication with Multi-Tab Session Management and Token Lifecycle Control

- **Complexity:**
  - Manage JSON Web Tokens across multiple tabs with synchronized state.
  - Handle token expiry, proactive refresh, and logout coordination.
  - Prevent reuse via backend token blacklisting and handle race conditions during active API calls.
- **Impact:**
  - If mishandled, users experience unexpected logouts, inconsistent auth states across tabs, or security risks from stale/blacklisted tokens.
  - API requests can fail mid-action, causing data loss or poor UX.
- **Implemented solution:**
  - Proactive refresh before expiry with a global session countdown and warning banner.
  - Unified storage strategy (localStorage/sessionStorage) with storage-event listeners to sync logout across tabs.
  - Backend token blacklist verification on every request; immediate invalidation on logout.
  - Graceful fallback on 401 responses: auto-logout and clear state, avoiding inconsistent sessions.

## 2) Real-Time Notifications with Personalized Messaging and Multi-Source Event Handling

- **Complexity:**
  - Maintain authenticated WebSocket connections and broadcast/targeted events for many concurrent users.
  - Personalize notifications by role and recipient (e.g., assignee sees “assigned to you”; others see “assigned to Officer A”).
  - Integrate events from multiple sources (partner webhooks, local updates) and keep UI in sync without manual refresh.
- **Impact:**
  - Without robust real-time logic, the UI becomes stale, admins miss assignments/status changes, and response SLAs degrade.
  - Poor targeting causes notification noise; reconnection gaps lead to missed updates.
- **Implemented solution:**
  - Authenticated sockets with JWT on handshake; per-user rooms enable targeted delivery.
  - Standardized events: new complaint, status change, assignment, each enriched with assignee/actor metadata.
  - Frontend listeners drive live UI updates across Dashboard, Complaint Management, and Complaint Detail.
  - Automatic reconnection and a dev-only mock panel to simulate events without backend.

## 3) Analytics & Reporting with Dynamic Aggregation and Time-Based Bucketing

- **Complexity:**
  - Aggregate multi-source complaint data (partner API + local DB) into unified schemas.
  - Support multiple time ranges with appropriate bucketing (hourly for “Today”, daily for longer ranges).
  - Apply logical AND filters across status, priority, category, faculty, and dates; compute metrics like average resolution time.
- **Impact:**
  - Incorrect aggregation or filtering yields misleading charts, broken exports, and invalid SLA assessments.
  - Large datasets can cause performance issues, timeouts, or memory pressure.
- **Implemented solution:**
  - Normalization layer to unify data, defensive date parsing, and de-duplication by display IDs.
  - Dynamic bucketing strategies per range; cached computations and debounced recalculations for performance.
  - Multi-format export (CSV/PDF/Excel) with chunking; real-time metric updates on socket events keep analytics current.

---

Use this document to explain the architectural decisions, the problems each area solves, and how the implementation ensures security, responsiveness, and scalability without exposing code.