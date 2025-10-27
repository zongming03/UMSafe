import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../services/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setMessage(
        "❌ Password must be at least 8 characters, with uppercase and lowercase letters."
      );
      setSuccess(false);
      return;
    }

    if (password !== confirm) {
      setMessage("❌ Passwords do not match");
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setSuccess(true);
      setMessage("✅ Password updated successfully!");
    } catch (err) {
      setSuccess(false);
      setMessage("❌ Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <Lock className="mx-auto text-blue-600" size={40} />
          <h2 className="text-2xl font-bold mt-2">Reset Your Password</h2>
          <p className="text-gray-500 text-sm">
            Must be at least 8 characters, include uppercase & lowercase letters
          </p>
        </div>

       
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 justify-center rounded-lg p-3 font-medium text-sm ${
              success
                ? "bg-green-50 text-green-700 border border-green-300"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            {success ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border rounded-lg p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full border rounded-lg p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
