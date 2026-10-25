import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/Login.css";

function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Views: login, forgot, reset
  const [view, setView] = useState("login");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearMessages();
  };

  const showLogin = () => {
    setView("login");
    setNewPassword("");
    setConfirmPassword("");
    clearMessages();
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      const result = await login(
        formData.email.trim(),
        formData.password
      );

      if (!result.success) {
        setError(result.message || "Unable to log in.");
        return;
      }

      if (result.user?.role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      const requestedPath = location.state?.from;

      const safeCustomerPaths = [
        "/home",
        "/products",
        "/cart",
        "/checkout",
        "/orders",
        "/profile",
        "/returns",
      ];

      const requestedUrl =
        typeof requestedPath === "object"
          ? requestedPath?.pathname
          : "";

      if (
        requestedUrl &&
        safeCustomerPaths.some(
          (path) =>
            requestedUrl === path ||
            requestedUrl.startsWith(`${path}/`)
        )
      ) {
        navigate(
          {
            pathname: requestedUrl,
            search:
              typeof requestedPath === "object"
                ? requestedPath.search || ""
                : "",
          },
          { replace: true }
        );
      } else {
        navigate("/home", { replace: true });
      }
    } catch {
      setError("Unable to log in. Please try again.");
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    const cleanEmail = resetEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      setError("Invalid email address. Please enter a valid email.");
      return;
    }

    setRequestLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: cleanEmail,
      });

      if (response.data?.success !== true) {
        setError(
          response.data?.message ||
            "Invalid email address. Please enter a valid registered email."
        );
        return;
      }

      setResetEmail(cleanEmail);
      setView("reset");
      clearMessages();
    } catch (requestError) {
      const status = requestError.response?.status;

      const serverMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        "";

      if (
        serverMessage.toLowerCase().includes("inactive") ||
        serverMessage.toLowerCase().includes("disabled")
      ) {
        setError(
          "This account is inactive. Please contact the administrator."
        );
      } else if (status === 400 || status === 404) {
        setError(
          "Invalid email address. Please enter a valid registered email."
        );
      } else if (status === 401 || status === 403) {
        setError(
          "The request was blocked by security. Please check the backend security configuration."
        );
      } else {
        setError("Unable to verify your email. Please try again later.");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setRequestLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email: resetEmail.trim(),
        newPassword,
      });

      if (response.data?.success !== true) {
        setError(
          response.data?.message || "Unable to reset your password."
        );
        return;
      }

      setMessage(
        "Password reset successfully. You can now sign in with your new password."
      );

      setFormData({
        email: resetEmail.trim(),
        password: "",
      });

      setNewPassword("");
      setConfirmPassword("");
      setView("login");
    } catch (requestError) {
      const status = requestError.response?.status;

      const serverMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        "";

      if (
        serverMessage.toLowerCase().includes("inactive") ||
        serverMessage.toLowerCase().includes("disabled")
      ) {
        setError(
          "This account is inactive. Please contact the administrator."
        );
      } else if (status === 400 || status === 404) {
        setError(
          "Unable to reset the password. Please check the email and password requirements."
        );
      } else if (status === 401 || status === 403) {
        setError(
          "The request was blocked by security. Please check the backend security configuration."
        );
      } else {
        setError("Unable to reset your password. Please try again.");
      }
    } finally {
      setRequestLoading(false);
    }
  };

  // =========================
  // RIGHT PANEL CONTENT
  // =========================

  const renderRightPanel = () => {
    if (view === "forgot") {
      return (
        <>
          <div className="login-heading">
            <span className="login-form-eyebrow">ACCOUNT RECOVERY</span>
            <h2>Forgot Password?</h2>
            <p>
              Enter the email address you used to create your
              FreshNest account.
            </p>
          </div>

          <form onSubmit={handleForgotPassword}>
            <div className="login-field">
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                value={resetEmail}
                onChange={(event) => {
                  setResetEmail(event.target.value);
                  clearMessages();
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={requestLoading}
            >
              {requestLoading ? "Checking email..." : "Continue"}
              {!requestLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <button
            type="button"
            className="login-text-button"
            onClick={showLogin}
          >
            ← Back to Login
          </button>
        </>
      );
    }

    if (view === "reset") {
      return (
        <>
          <div className="login-heading">
            <span className="login-form-eyebrow">ACCOUNT RECOVERY</span>
            <h2>Reset Password</h2>
            <p>
              Create a new password for{" "}
              <strong className="login-reset-email">{resetEmail}</strong>.
            </p>
          </div>

          <form onSubmit={handleResetPassword}>
            <div className="login-field">
              <label htmlFor="new-password">New password</label>

              <div className="login-password-wrap">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    clearMessages();
                  }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowNewPassword((previous) => !previous)
                  }
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">
                Confirm new password
              </label>

              <div className="login-password-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearMessages();
                  }}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={requestLoading}
            >
              {requestLoading ? "Resetting password..." : "Reset Password"}
              {!requestLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <button
            type="button"
            className="login-text-button"
            onClick={() => {
              setView("forgot");
              setNewPassword("");
              setConfirmPassword("");
              clearMessages();
            }}
          >
            ← Back to email verification
          </button>
        </>
      );
    }

    return (
      <>
        <div className="login-heading">
          <span className="login-form-eyebrow">YOUR ACCOUNT</span>
          <h2>Welcome back!</h2>
          <p>Enter your details to sign in to your account.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <div className="login-password-heading">
              <label htmlFor="login-password">Password</label>

              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setResetEmail(formData.email.trim());
                  setView("forgot");
                  clearMessages();
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="login-register-prompt">
          Don't have an account?{" "}
          <Link to="/register">Create account</Link>
        </div>

        <Link to="/" className="login-back-home">
          <span aria-hidden="true">←</span>
          Back to home
        </Link>
      </>
    );
  };

  return (
    <main className="login-page">
      <section className="login-layout">
        {/* This left panel remains unchanged in all three views. */}
        <div className="login-showcase">
          <Link to="/" className="login-brand">
            <span className="login-brand-icon" aria-hidden="true">
              🐔
            </span>
            <span>
              <strong>FreshNest</strong>
              <small>Chicken &amp; Eggs</small>
            </span>
          </Link>

          <div className="login-showcase-content">
            <span className="login-eyebrow">WELCOME BACK</span>
            <h1>
              Fresh choices.
              <br />
              <span>Easy ordering.</span>
            </h1>
            <p>
              Sign in to explore products, manage your orders,
              and make your next meal easier.
            </p>

            <div className="login-showcase-benefits">
              <div><span aria-hidden="true">✓</span> Easy online ordering</div>
              <div><span aria-hidden="true">✓</span> Track your orders</div>
              <div><span aria-hidden="true">✓</span> Manage your profile</div>
            </div>
          </div>

          <div className="login-showcase-footer">
            Quality choices for everyday meals.
          </div>

          <div className="login-decoration" aria-hidden="true">
            🐔
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-card">
            <div className="login-mobile-brand">
              <span aria-hidden="true">🐔</span>
              <strong>FreshNest</strong>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            {message && (
              <div className="login-success" role="status">
                {message}
              </div>
            )}

            {renderRightPanel()}
          </div>

          <p className="login-security-note">
            Your account is protected by secure authentication.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;