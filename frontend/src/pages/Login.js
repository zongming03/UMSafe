import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
  faComments,
  faChartBar,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";
import UMSafeLogo from "../assets/UMSafeLogo.png";
import umcampus from "../assets/um-campus5.jpg";
import "../styles/Login.css";
import Footer from "../components/footer";

import { useNavigate } from "react-router-dom";

const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setLoginError("");

    // Simulate API login
    setTimeout(() => {
      setIsLoading(false);
      if (email === "admin@example.com" && password === "password123") {
        setIsLoggedIn(true);
        navigate("/room");
      } else {
        setLoginError("Invalid email or password.");
      }
    }, 1000);
  };

  return (
    <div className="login-container ">
      <div className="login-container-upper">
        {/* Left side - Login form */}
        <div className="login-left-side">
          <div className="login-backdrop">
            <div className="text-center mb-4">
              <div className="mb-2">
                <img
                  src={UMSafeLogo}
                  alt="UMSafeLogo"
                  className="h-28 w-auto mx-auto"
                />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-1">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to your account to continue
              </p>
            </div>
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="email-box">
                  <div className="email-icon">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-gray-400"
                    />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="password-input"
                    placeholder="••••••••"
                  />
                  <div
                    className="password-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="password-toggle-icon-login"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="remember-me-box"
                    />
                    <label
                      htmlFor="remember-me"
                      className="remember-label"
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      Remember me
                    </label>
                  </div>
                </div>
                <div className="text-sm">
                  <button
                    onClick={() => {
                      setLoginError(
                        "Password reset link has been sent to your email"
                      );
                      setTimeout(() => setLoginError(""), 3000);
                    }}
                    className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="signin-button"
                >
                  <span className="signin-button-span"></span>
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Right side  */}
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
            <p className="text-lg mb-6">
              Efficiently manage and resolve student complaints with our
              comprehensive platform.
            </p>
            <div className="description-container-points">
              <div className="points-animation">
                <div className="points-animation-icon">
                  <FontAwesomeIcon icon={faTasks}></FontAwesomeIcon>
                </div>
                <div className="ml-4">
                  <h3 className="points-wording">Streamlined Workflow</h3>
                  <p className="mt-1">
                    Track complaints from submission to resolution
                  </p>
                </div>
              </div>
              <div className="points-animation">
                <div className="points-animation-icon">
                  <FontAwesomeIcon icon={faComments}></FontAwesomeIcon>
                </div>
                <div className="ml-4">
                  <h3 className="points-wording">Real-Time Communication</h3>
                  <p className="mt-1">
                    Direct messaging between students and staff
                  </p>
                </div>
              </div>
              <div className="points-animation">
                <div className="points-animation-icon">
                  <FontAwesomeIcon icon={faChartBar}></FontAwesomeIcon>
                </div>
                <div className="ml-4">
                  <h3 className="points-wording">Comprehensive Analytics</h3>
                  <p className="mt-1">
                    Gain insights to improve campus services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default LoginPage;
