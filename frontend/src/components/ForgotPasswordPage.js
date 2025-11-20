import { useState } from "react";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UMSafeLogo from "../assets/UMSafeLogo.png";
import umcampus from "../assets/um-campus5.jpg";
import "../styles/Login.css";
import Footer from "../components/footer";
import { forgotPassword } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await forgotPassword(email);
      setMessage("✅ Password reset link sent to your email");

      setTimeout(() => {
        navigate("/login");
      }, 15000);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Error sending reset link. Try again.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-container-upper">
        {/* Left side - Forgot Password form */}
        <div className="login-left-side">
          <div className="login-backdrop">
            <div className="text-center mb-6">
              <img
                src={UMSafeLogo}
                alt="UMSafeLogo"
                className="h-24 w-auto mx-auto mb-3"
              />
              <h1 className="text-2xl font-semibold text-gray-800">
                Reset Your Password
              </h1>
              <p className="text-gray-600">
                Enter your registered email and we'll send you a reset link.
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-center font-medium ${
                  message.startsWith("✅")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message}
                {message.startsWith("✅") && (
                  <p className="text-sm text-gray-500 mt-2">
                    Redirecting to login in 15 seconds...
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-blue-500"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-lg font-medium transition text-white ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md"
                }`}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>

        {/* Right side - Image and description */}
        <div className="right-side-container">
          <div className="right-side-container-bg">
            <img
              src={umcampus}
              alt="University Campus"
              className="unicampusImage"
            />
            <div className="unicampusBgColor"></div>
          </div>
          <div className="description-container">
            <h2 className="text-2xl font-bold mb-4">
              Complaint Management System
            </h2>
            <p className="text-xl  mb-6">
              Secure and reliable password reset to keep your account safe.
            </p>
            <p className="text-white-300">
              Ensure your account access is always protected with our secure
              reset process.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
