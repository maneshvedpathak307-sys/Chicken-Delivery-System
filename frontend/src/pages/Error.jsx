import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Error.css";

export default function Error() {
  const location = useLocation();
  const isUnauthorized = location.pathname === "/unauthorized";

  const errorCode = isUnauthorized ? "403" : "404";
  const title = isUnauthorized ? "Access Denied" : "Page Not Found";

  const description = isUnauthorized
    ? "Sorry, you don't have permission to access this page. Please sign in with an account that has the required access."
    : "Sorry, the page you're looking for doesn't exist or may have been moved. Let's get you back to FreshNest.";

  return (
    <main className="fresh-error-page">
      <section className="fresh-error-card">
        <Link to="/" className="fresh-error-brand">
          <span className="fresh-error-brand-icon" aria-hidden="true">
            🐔
          </span>

          <span className="fresh-error-brand-text">
            <strong>FreshNest</strong>
            <small>Chicken &amp; Eggs</small>
          </span>
        </Link>

        <div className="fresh-error-content">
          <div className="fresh-error-icon" aria-hidden="true">
            {isUnauthorized ? "🔒" : "🔎"}
          </div>

          <span className="fresh-error-code">ERROR {errorCode}</span>

          <h1>{title}</h1>

          <p className="fresh-error-description">{description}</p>

          <div className="fresh-error-actions">
            <Link to="/" className="fresh-error-home-button">
              <span aria-hidden="true">←</span>
              Back to Home
            </Link>

            {isUnauthorized && (
              <Link to="/login" className="fresh-error-login-button">
                Sign In
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          <p className="fresh-error-help">
            Fresh choices. Delivered with care.
          </p>
        </div>

        <footer className="fresh-error-footer">
          <span aria-hidden="true">🐔</span>
          FreshNest — Chicken &amp; Eggs
        </footer>
      </section>
    </main>
  );
}