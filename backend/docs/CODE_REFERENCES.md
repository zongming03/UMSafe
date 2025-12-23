# UMSafe Code References (No Code Included)

This document lists the relevant files and functions you can point to if a lecturer asks to see where each complexity is implemented. It avoids showing code; use it as a guide to navigate.

## 1) JWT Authentication & Session Lifecycle

- Backend Middleware
  - [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js)
    - Verify JWT on each request (authMiddleware)
    - Attach req.user with role, faculty, and identifiers
    - Handle invalid/expired tokens
- Backend Controller (Logout / Token Handling)
  - [backend/controllers/authController.js](backend/controllers/authController.js)
    - Login / Logout endpoints
    - Token issuance and invalidation logic
- Frontend Context (Session Management)
  - [frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js)
    - login() stores token and user
    - logout() clears storage and coordinates across tabs
    - startSessionCountdown() updates timeLeft and warning state
    - extendSession() calls backend refresh and resets timers

## 2) Real-Time Notifications (Socket.IO)

- Socket Server Initialization & Auth
  - [backend/realtime/socket.js](backend/realtime/socket.js)
    - initSocket(server) attaches Socket.IO to HTTP server
    - JWT verification during socket handshake
    - Per-user rooms for targeted emits
- Server Bootstrap
  - [backend/index.js](backend/index.js)
    - Create HTTP server and call initSocket(server)
    - Decouple DB connect from server listen
- Event Emissions (Complaints)
  - [backend/controllers/complaintController.js](backend/controllers/complaintController.js)
    - updateComplaintStatus() emits complaint:status
    - assignComplaint() emits complaint:assignment (broadcast + targeted)
    - handleNewComplaintWebhook() emits complaint:new
    - Payload includes adminName, updatedByName for personalized toasts
- Frontend Socket Client & Global Notifications
  - [frontend/src/services/socket.js](frontend/src/services/socket.js)
    - initSocket(token) sets up client with JWT auth
  - [frontend/src/components/SocketListener.js](frontend/src/components/SocketListener.js)
    - Subscribes to complaint:new, complaint:status, complaint:assignment
    - Personalizes messages: assignee sees “assigned to you”; others see assignee name
  - [frontend/src/components/SocketTestPanel.js](frontend/src/components/SocketTestPanel.js)
    - Dev-only mock event buttons (no backend required)
- Live Page Auto-Refresh Hooks
  - [frontend/src/hooks/useComplaintUpdates.js](frontend/src/hooks/useComplaintUpdates.js)
    - Reusable hook to subscribe to complaint events and update local state
  - Consumers:
    - [frontend/src/pages/Dashboard.js](frontend/src/pages/Dashboard.js)
    - [frontend/src/pages/ComplaintManagement.js](frontend/src/pages/ComplaintManagement.js)
    - [frontend/src/pages/ComplaintDetail.js](frontend/src/pages/ComplaintDetail.js)

## 3) Analytics & Reporting

- Backend Analytics API
  - [backend/routes/analyticsRoutes.js](backend/routes/analyticsRoutes.js)
    - Routes for analytics endpoints
  - [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)
    - Metrics calculations (counts, trends, performance)
- Frontend Analytics & Dashboards
  - [frontend/src/pages/AnalyticDashboard.js](frontend/src/pages/AnalyticDashboard.js)
    - Time-range selection and filtering (logical AND)
    - Dynamic series construction for charts
  - [frontend/src/pages/Dashboard.js](frontend/src/pages/Dashboard.js)
    - ECharts-based trend charts and Kanban status buckets
- Documentation
  - [backend/docs/PERFORMANCE_METRICS_CALCULATION.md](backend/docs/PERFORMANCE_METRICS_CALCULATION.md)
    - Metric definitions (e.g., average resolution time, SLA logic)

## How to Use During Q&A

- When asked “Where is X implemented?”, open the linked file and point to the named function or section.
- If asked to show code, reveal only the relevant function body (not the entire file), keeping explanations focused.
- For real-time demo, use two browser tabs and trigger an assignment or status change to show live updates without refresh.
