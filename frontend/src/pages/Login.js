import { useContext, useState, useCallback } from "react";
import "../styles/Login.css";
import Footer from "../components/footer";
import { login as apiLogin } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import LoginForm from "../components/LoginForm";
import LoginHero from "../components/LoginHero";
import umcampus from "../assets/um-campus5.jpg";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      const res = await apiLogin({ email, password });
      if (!res || !res.data || !res.data.token || !res.data.user) {
        throw new Error("Invalid response from server");
      }

      const { token, user } = res.data;

      await login(user, token, rememberMe);
      
      // Force a full page reload to ensure router sees the updated user state
      window.location.href = "/dashboard";
    } catch (err) {
      const apiMsg = err?.response?.data?.msg;
      const requiresVerification = err?.response?.data?.requiresEmailVerification;

      if (requiresVerification) {
        setLoginError(
          apiMsg ||
            "Email not verified yet. Please check your inbox for the verification link and complete verification before logging in."
        );
      } else {
        setLoginError(apiMsg || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, rememberMe]);

  return (
    <div className="login-container ">
      <div className="login-container-upper">
        {/* Left side - Login form */}
        <div className="login-left-side">
          <LoginForm
            email={email}
            password={password}
            rememberMe={rememberMe}
            showPassword={showPassword}
            loginError={loginError}
            isLoading={isLoading}
            onEmailChange={(e) => setEmail(e.target.value)}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onRememberChange={() => setRememberMe(!rememberMe)}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Right side  */}
        <LoginHero imageSrc={umcampus} />
      </div>
      <Footer />
    </div>
  );
};
export default LoginPage;
