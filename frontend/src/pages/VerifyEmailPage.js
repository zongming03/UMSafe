import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/VerifyEmailPage.css";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const apiBase =
          process.env.REACT_APP_API_BASE_URL || `${window.location.origin}/admin`;
        const sanitizedBase = apiBase.replace(/\/$/, "");
        const url = `${sanitizedBase}/auth/verify-email/${encodeURIComponent(
          token || ""
        )}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { msg: text };
        }

        if (data.success || response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            data.msg || "Failed to verify email. Token may have expired or is invalid."
          );
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage(
          "An error occurred during verification."
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className={`verify-status ${status}`}>
          {status === "verifying" && (
            <div className="spinner"></div>
          )}
          {status === "success" && (
            <div className="success-icon">✓</div>
          )}
          {status === "error" && (
            <div className="error-icon">✕</div>
          )}
        </div>

        <h1 className="verify-title">Email Verification</h1>
        <p className="verify-message">{message}</p>

        {status === "success" && (
          <p className="verify-info">
            You will be redirected to the login page shortly.
          </p>
        )}

        {status === "error" && (
          <div className="verify-actions">
            <button
              onClick={() => navigate("/login")}
              className="btn-back-to-login"
            >
              Back to Login
            </button>
            <p className="verify-help">
              <strong>Verification failed.</strong> Please contact your administrator to have your account added again, or ask them to resend the verification email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
