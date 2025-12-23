import React from "react";

const mockPayloads = {
  newComplaint: {
    event: "complaint:new",
    payload: { complaintId: "RPT-2024-01", title: "Mock leak in lab", facultyId: "FAC-01" },
  },
  status: {
    event: "complaint:status",
    payload: { complaintId: "RPT-2024-01", status: "in progress", previousStatus: "open" },
  },
  assignment: {
    event: "complaint:assignment",
    payload: { complaintId: "RPT-2024-01", adminId: "ADMIN-123" },
  },
};

const dispatchMock = ({ event, payload }) => {
  window.dispatchEvent(
    new CustomEvent("mock:socket", {
      detail: { event, payload },
    })
  );
};

const SocketTestPanel = () => {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        background: "#0f172a",
        color: "#e2e8f0",
        borderRadius: "10px",
        padding: "10px 12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        zIndex: 999,
        display: "flex",
        gap: "8px",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "12px", opacity: 0.8 }}>Socket mock:</span>
      <button
        onClick={() => dispatchMock(mockPayloads.newComplaint)}
        style={buttonStyle}
      >
        New
      </button>
      <button
        onClick={() => dispatchMock(mockPayloads.status)}
        style={buttonStyle}
      >
        Status
      </button>
      <button
        onClick={() => dispatchMock(mockPayloads.assignment)}
        style={buttonStyle}
      >
        Assign
      </button>
    </div>
  );
};

const buttonStyle = {
  background: "#38bdf8",
  color: "#0f172a",
  border: "none",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

export default SocketTestPanel;
