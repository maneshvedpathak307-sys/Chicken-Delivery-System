import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/UserHome.css";

const benefits = [
  {
    icon: "❄️",
    title: "Freshness first",
    description: "Carefully handled products for your kitchen.",
  },
  {
    icon: "🚚",
    title: "Convenient delivery",
    description: "Place your order online from home.",
  },
  {
    icon: "🔒",
    title: "Secure account",
    description: "Manage your profile and orders in one place.",
  },
];

export default function UserHome() {
  const { user } = useAuth();

  const customerName =
    user?.name?.trim()?.split(/\s+/)[0] || "there";

  return (
    <main className="user-home">
      <section className="user-home-welcome">
        <div className="user-home-welcome-content">
          <span className="user-home-eyebrow">
            WELCOME BACK TO FRESHNEST
          </span>

          <h1>
            Hello, {customerName}!
            <br />
            <span>What's cooking today?</span>
          </h1>

          <p>
            Find fresh chicken and everyday essentials for your next
            delicious meal.
          </p>

          <div className="user-home-actions">
            <Link
              to="/products"
              className="user-home-primary-btn"
            >
              Shop Products <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/orders"
              className="user-home-secondary-btn"
            >
              My Orders
            </Link>
          </div>

          <div className="user-home-delivery-note">
            <span aria-hidden="true">🚚</span>

            <span>
              <strong>Freshness at your doorstep</strong>
              <small>
                Delivery timing depends on your location.
              </small>
            </span>
          </div>
        </div>

        <div
          className="user-home-hero-art"
          aria-label="Fresh chicken"
        >
          <div className="user-home-hero-circle">
            <span
              className="user-home-chicken-emoji"
              role="img"
              aria-label="Chicken"
            >
              🍗
            </span>
          </div>

          <div className="user-home-floating-card">
            <span className="user-home-floating-icon">✓</span>

            <span>
              <strong>Easy ordering</strong>
              <small>Shop in a few clicks</small>
            </span>
          </div>

          <span className="user-home-decor user-home-decor-one">
            ✦
          </span>

          <span className="user-home-decor user-home-decor-two">
            ✧
          </span>
        </div>
      </section>

      <section
        className="user-home-quick-links"
        aria-label="Quick links"
      >
        <Link
          to="/products"
          className="user-home-quick-card"
        >
          <span className="user-home-quick-icon">🛍️</span>

          <span>
            <strong>Shop Products</strong>
            <small>Browse our selection</small>
          </span>

          <span className="user-home-quick-arrow">→</span>
        </Link>

        <Link
          to="/cart"
          className="user-home-quick-card"
        >
          <span className="user-home-quick-icon">🛒</span>

          <span>
            <strong>My Cart</strong>
            <small>Review your items</small>
          </span>

          <span className="user-home-quick-arrow">→</span>
        </Link>

        <Link
          to="/orders"
          className="user-home-quick-card"
        >
          <span className="user-home-quick-icon">📦</span>

          <span>
            <strong>My Orders</strong>
            <small>View order history</small>
          </span>

          <span className="user-home-quick-arrow">→</span>
        </Link>

        <Link
          to="/profile"
          className="user-home-quick-card"
        >
          <span className="user-home-quick-icon">👤</span>

          <span>
            <strong>My Profile</strong>
            <small>Manage your details</small>
          </span>

          <span className="user-home-quick-arrow">→</span>
        </Link>
      </section>

      <section className="user-home-benefits">
        <div className="user-home-benefits-heading">
          <span className="user-home-section-label">
            WHY FRESHNEST
          </span>

          <h2>A better way to shop</h2>

          <p>
            Simple, convenient shopping for your everyday kitchen needs.
          </p>
        </div>

        <div className="user-home-benefits-grid">
          {benefits.map((benefit) => (
            <article
              className="user-home-benefit-card"
              key={benefit.title}
            >
              <span className="user-home-benefit-icon">
                {benefit.icon}
              </span>

              <h3>{benefit.title}</h3>

              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="user-home-bottom-cta">
        <div>
          <span>READY FOR YOUR NEXT MEAL?</span>

          <h2>Bring something fresh to your table.</h2>

          <p>
            Explore our selection and place your order online.
          </p>
        </div>

        <Link
          to="/products"
          className="user-home-cta-btn"
        >
          Start Shopping <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}