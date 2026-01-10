import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const LoginForm = ({
  email,
  password,
  rememberMe,
  showPassword,
  loginError,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onSubmit,
}) => {
  return (
    <div className="login-backdrop">
      <div className="text-center mb-4">
        <div className="m-0 p-0">
          <img src={require("../assets/UMSafeLogoWithName.png")} alt="UMSafeLogo" className="h-40 w-auto mx-auto m-0 p-0" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your account to continue</p>
      </div>

      {loginError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {loginError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="email-box">
            <div className="email-icon">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={onEmailChange}
              required
              className="email-input"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="password-label">
            Password
          </label>
          <div className="relative">
            <div className="password-icon">
              <FontAwesomeIcon icon={faLock} className="text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={onPasswordChange}
              required
              className="password-input"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="password-eye"
              onClick={onTogglePassword}
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="password-toggle-icon-login"
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={onRememberChange}
              className="remember-me-box"
            />
            <span className="remember-label">Remember me</span>
          </label>
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="signin-button"
          >
            <span className="signin-button-span"></span>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
