import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();

    if (!name || !email || !phone || !address || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = await register({
      name,
      email,
      phone,
      address,
      password: formData.password,
    });

    if (!result.success) {
      setError(result.message || "Registration failed. Please try again.");
      return;
    }

    setSuccess("Your account has been created successfully.");

    navigate("/login", {
      replace: true,
      state: { registrationSuccess: true, email },
    });
  };

  return (
    <main className="register-page">
      {/* Left branding panel */}
      <section className="register-visual">
        <Link to="/" className="register-brand">
          <span className="register-brand-icon" aria-hidden="true">
            🐔
          </span>

          <span className="register-brand-text">
            <strong>FreshNest</strong>
            <small>Chicken &amp; Eggs</small>
          </span>
        </Link>

        <div className="register-visual-content">
          <span className="register-eyebrow">
            WELCOME TO FRESHNEST
          </span>

          <h1>
            Fresh chicken.
            <br />
            <span>Better meals.</span>
          </h1>

          <p>
            Create your account to discover fresh chicken products,
            place orders, and manage your deliveries with ease.
          </p>

          <div className="register-feature">
            <span className="register-feature-icon" aria-hidden="true">
              ✓
            </span>
            <span>Freshness you can trust</span>
          </div>

          <div className="register-feature">
            <span className="register-feature-icon" aria-hidden="true">
              ✓
            </span>
            <span>Easy and secure ordering</span>
          </div>

          <div className="register-feature">
            <span className="register-feature-icon" aria-hidden="true">
              ✓
            </span>
            <span>Convenient order tracking</span>
          </div>
        </div>

        <p className="register-visual-footer">
          Fresh choices. Delivered with care.
        </p>

        <div className="register-decoration" aria-hidden="true">
          🐔
        </div>
      </section>

      {/* Registration form */}
      <section className="register-form-section">
        <div className="register-form-container">
          {/* Mobile branding */}
          <Link to="/" className="register-mobile-brand">
            <span className="register-mobile-icon" aria-hidden="true">
              🐔
            </span>

            <span className="register-mobile-brand-text">
              <strong>FreshNest</strong>
              <small>Chicken &amp; Eggs</small>
            </span>
          </Link>

          <div className="register-heading">
            <span className="register-step-label">
              GET STARTED
            </span>

            <h2>Create your account</h2>

            <p>Enter your details to join FreshNest.</p>
          </div>

          {error && (
            <div
              className="register-alert register-alert-error"
              role="alert"
            >
              <span aria-hidden="true">!</span>
              {error}
            </div>
          )}

          {success && (
            <div
              className="register-alert register-alert-success"
              role="status"
            >
              {success}
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={150}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="address">Delivery address</label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter your full delivery address"
                value={formData.address}
                onChange={handleChange}
                autoComplete="street-address"
                maxLength={500}
                rows={3}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">Password</label>

              <div className="register-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  maxLength={100}
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <small>Use at least 6 characters.</small>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="register-password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  maxLength={100}
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="register-login-prompt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className="register-terms">
            By creating an account, you agree to use FreshNest responsibly.
          </p>

          <Link to="/" className="register-back-home">
            <span aria-hidden="true">←</span>
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}