import React from "react";
import { Link } from "react-router-dom";
import "../styles/GuestHome.css";

function GuestHome() {
  return (
    <main className="guest-home">
      {/* Hero Section */}
      <section className="guest-hero">
        <div className="guest-hero-content">
          <span className="guest-badge">
            <span className="guest-badge-dot" />
            FRESHNESS AT YOUR DOORSTEP
          </span>

          <h1>
            Fresh Chicken.
            <br />
            <span>Happy Meals.</span>
          </h1>

          <p className="guest-hero-description">
            Fresh chicken and quality eggs for your everyday meals.
            Order with confidence and enjoy convenient home delivery.
          </p>

          <div className="guest-hero-actions">
            <Link to="/register" className="guest-primary-button">
              Start Ordering
              <span aria-hidden="true">→</span>
            </Link>

            <Link to="/login" className="guest-secondary-button">
              Sign In
            </Link>
          </div>

          <div className="guest-hero-points">
            <span>✓ Quality products</span>
            <span>✓ Easy ordering</span>
            <span>✓ Convenient delivery</span>
          </div>
        </div>

        {/* Hero Image — floating cards removed */}
        <div className="guest-hero-visual">
          <div className="guest-hero-circle" />

          <div className="guest-hero-image-frame">
            <img
              className="guest-hen-image"
              src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=85"
              alt="Hen in a farm setting"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="guest-benefits">
        <div className="guest-section-heading">
          <span className="guest-section-eyebrow">
            GOOD FOOD STARTS HERE
          </span>

          <h2>
            Fresh choices for <span>every meal</span>
          </h2>

          <p>
            Find everyday essentials for delicious meals at home.
          </p>
        </div>

        <div className="guest-benefit-grid">
          <article className="guest-benefit-card">
            <div className="guest-benefit-icon guest-chicken-icon">
              <span role="img" aria-label="Chicken">
                🍗
              </span>
            </div>

            <h3>Chicken for Every Recipe</h3>

            <p>
              A versatile source of protein for curries, grills,
              family dinners, and your favourite recipes.
            </p>
          </article>

          <article className="guest-benefit-card">
            <div className="guest-benefit-icon guest-egg-icon">
              <span role="img" aria-label="Eggs">
                🥚
              </span>
            </div>

            <h3>Everyday Egg Nutrition</h3>

            <p>
              Eggs provide protein and important nutrients,
              making them a convenient addition to your meals.
            </p>
          </article>

          <article className="guest-benefit-card">
            <div className="guest-benefit-icon guest-delivery-icon">
              <span role="img" aria-label="Delivery">
                🛵
              </span>
            </div>

            <h3>Convenient Home Delivery</h3>

            <p>
              Browse products, place your order, and follow
              your order status from your account.
            </p>
          </article>
        </div>
      </section>

      {/* How It Works */}
      <section className="guest-how-it-works">
        <div className="guest-how-content">
          <span className="guest-section-eyebrow">
            SIMPLE AND CONVENIENT
          </span>

          <h2>Good food in three easy steps</h2>

          <div className="guest-steps">
            <div className="guest-step">
              <span className="guest-step-number">01</span>
              <div>
                <h3>Create your account</h3>
                <p>Register to get started with your orders.</p>
              </div>
            </div>

            <div className="guest-step">
              <span className="guest-step-number">02</span>
              <div>
                <h3>Choose your products</h3>
                <p>
                  Add your favourite chicken and eggs to your cart.
                </p>
              </div>
            </div>

            <div className="guest-step">
              <span className="guest-step-number">03</span>
              <div>
                <h3>Place your order</h3>
                <p>
                  Complete checkout and view your order status.
                </p>
              </div>
            </div>
          </div>

          <Link to="/register" className="guest-primary-button">
            Get Started
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="guest-how-visual" aria-hidden="true">
          <div className="guest-how-circle">
            <span className="guest-how-hen">🐔</span>
            <span className="guest-how-heart">♥</span>
          </div>

          <div className="guest-how-caption">
            <strong>Fresh choices. Easy ordering.</strong>
            <span>Your kitchen, made simpler.</span>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="guest-final-cta">
        <div>
          <span className="guest-cta-eyebrow">
            READY WHEN YOU ARE
          </span>

          <h2>Your next delicious meal starts here.</h2>
          <p>Create your account and explore our products.</p>
        </div>

        <Link to="/register" className="guest-cta-button">
          Join Us Today <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="guest-footer">
        <p className="guest-footer-copy">
          Project Developed by{" "}
          <strong>Manesh Vedpathak</strong>
        </p>
      </footer>
    </main>
  );
}

export default GuestHome;