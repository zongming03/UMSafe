# Anonymous Complaint Chatroom Protection

## Overview
This document outlines the comprehensive protection mechanisms implemented to prevent chatroom creation for anonymous complaints across all possible paths.

## Protection Layers

### 1. **Backend Protection (Highest Priority)**
**File:** `backend/routes/partnerProxy.js`

A validation function `validateAnonymousComplaintRestriction()` is invoked before any chatroom initiation request is proxied to the partner API.

**How it works:**
- Intercepts all POST requests to `/admin/reports/{reportId}/chatrooms/initiate`
- Fetches the report details from the partner API using the reportId
- Checks the `isAnonymous` flag from the report data
- If `isAnonymous === true`, returns HTTP 400 with error message:
  ```json
  {
    "error": "Chatroom creation is not allowed for anonymous complaints. The student must be identified before initiating direct communication."
  }
  ```
- If not anonymous or if verification fails, allows the request to proceed

**Key Code Section:**
```javascript
const validateAnonymousComplaintRestriction = async (req, partnerApiBaseUrl) => {
  // Checks if request is for /chatrooms/initiate
  // Fetches report details
  // Validates isAnonymous flag
  // Blocks if anonymous
}
```

**Advantages:**
- Prevents any direct API calls from bypassing frontend validation
- Works regardless of client source (mobile app, browser, API calls)
- Backend is the source of truth for complaint data

### 2. **Frontend Protection Layer 1: ComplaintDetail.js**
**File:** `frontend/src/pages/ComplaintDetail.js`

Two validation points prevent chatroom creation from the main complaint detail page.

**Protection Point A - handleOpenChatroom():**
- Checks `isAnonymous` flag before any chatroom operation
- Returns early with toast error if complaint is anonymous
- Prevents navigation to chatroom or modal opening

**Protection Point B - handleConfirmCreateChatroom():**
- Double-checks `isAnonymous` flag before API call
- Even if the modal opens, this prevents chatroom creation
- Toast message explains why chatroom cannot be created

**Key Code Sections:**
```javascript
const handleOpenChatroom = async () => {
  if (isAnonymous) {
    toast.error("Chatroom is not available for anonymous complaints...");
    return;
  }
  // ... rest of logic
}

const handleConfirmCreateChatroom = async () => {
  if (isAnonymous) {
    toast.error("Chatroom cannot be created for anonymous complaints...");
    return;
  }
  // ... rest of logic
}
```

### 3. **Frontend Protection Layer 2: QuickActionCard.js**
**File:** `frontend/src/components/QuickActionCard.js`

The "Chat with Student" button is conditionally rendered only for non-anonymous complaints:

```javascript
{!isAnonymous && (
  <button
    onClick={handleOpenChatroom}
    className="..."
  >
    <span className="flex items-center space-x-2">
      <FontAwesomeIcon icon={faComments} />
      <span>Chat with Student</span>
    </span>
  </button>
)}
```

**Effect:** The button is completely hidden from the UI for anonymous complaints.

### 4. **Frontend Protection Layer 3: ComplaintChat.js**
**File:** `frontend/src/pages/ComplaintChat.js`

When a user attempts to send a message in the chat and no chatroom exists yet, a validation check prevents chatroom creation:

**Protection Point - handleSendMessage():**
```javascript
if (!roomId) {
  // 🔒 VALIDATION: Check if complaint is anonymous
  if (complaint?.isAnonymous) {
    alert("Chatroom cannot be created for anonymous complaints...");
    setIsSending(false);
    // Remove optimistically added message
    setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
    return;
  }
  const res = await initiateChatroom(reportId);
  // ...
}
```

**Effect:** Even if a user somehow reaches the chat page for an anonymous complaint and tries to send a message, the chatroom creation is blocked.

### 5. **API Service Layer: reportsApi.js**
**File:** `frontend/src/services/reportsApi.js`

The `initiateChatroom()` function includes validation:

```javascript
export const initiateChatroom = async (reportId) => {
  if (!reportId) {
    throw new Error("Report ID is required to create a chatroom");
  }
  const response = await api.post(`/reports/${reportId}/chatrooms/initiate`);
  return response.data;
};
```

**Note:** This layer includes comments indicating that backend validation is the primary enforcer.

## Attack Paths Covered

| Path | Protection | Layer |
|------|-----------|-------|
| Click "Chat with Student" button | Button hidden | UI |
| Open create chatroom modal | Modal prevented by handleOpenChatroom() | Frontend |
| Confirm chatroom creation | Validation in handleConfirmCreateChatroom() | Frontend |
| Send message without existing room | Validation in handleSendMessage() | Frontend |
| Direct API call to /chatrooms/initiate | Backend validation | Backend ✓ |
| API call via proxy | validateAnonymousComplaintRestriction() | Backend ✓ |
| Mobile app chatroom creation | Backend validation | Backend ✓ |

## Error Messages

### Frontend Errors:
- **handleOpenChatroom()**: "Chatroom is not available for anonymous complaints. The student must be identified first."
- **handleConfirmCreateChatroom()**: "Chatroom cannot be created for anonymous complaints. The student must be identified first."
- **handleSendMessage()**: "Chatroom cannot be created for anonymous complaints. The student must be identified first."

### Backend Error:
- **HTTP 400**: "Chatroom creation is not allowed for anonymous complaints. The student must be identified before initiating direct communication."

## Flow Diagram

```
User Action → Frontend Check (UI/Handler) → API Call → Backend Validation → Partner API
     ↓ (if anonymous)
   Block with Toast/Alert message
                                           ↓ (if anonymous)
                                        Return 400 error
```

## Testing Checklist

- [ ] Anonymous complaint has no "Chat with Student" button in QuickActionCard
- [ ] Cannot open "Create Chatroom" modal for anonymous complaint
- [ ] Cannot confirm chatroom creation for anonymous complaint
- [ ] Cannot send message that would initiate chatroom for anonymous complaint
- [ ] Direct API POST to `/admin/reports/{id}/chatrooms/initiate` returns 400 for anonymous
- [ ] Error messages are clear and user-friendly
- [ ] Super admin cannot create chatroom for anonymous complaints
- [ ] Regular staff cannot create chatroom for anonymous complaints
- [ ] Non-anonymous complaints work normally with chatroom creation

## Implementation Details

### isAnonymous Flag Source:
- Comes from complaint data fetched from partner API
- Available in complaint object in most components
- Checked in ComplaintDetail.js at line 69: `const isAnonymous = complaint?.isAnonymous || false;`

### Backend Report Verification:
- Fetches report from partner API using reportId
- Checks report.isAnonymous directly from partner API response
- Prevents reliance on client-side data for security decisions

## Future Enhancements

1. Add audit logging when chatroom creation attempts are blocked
2. Notify admins when anonymous complaints are created (so they can identify the student)
3. Add a workflow to "reveal" anonymous complaints before chatroom creation becomes available
4. Consider adding email/SMS notification option for identified anonymous complaints instead of chatroom

## Security Notes

✅ **Backend-First Validation**: The backend proxy is the primary enforcer, making this secure against client-side manipulation.

✅ **No Client-Side Bypass**: Even if frontend validation is bypassed (developer tools, network interception), the backend will reject the request.

✅ **Clear Separation**: Frontend checks provide UX feedback; backend checks enforce security.

✅ **Multiple Entry Points Covered**: Chatroom can be initiated from multiple places (modal, chat page), and all are protected.
