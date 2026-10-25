import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/AdminDashboard.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/dashboard");

      const dashboardData =
        response.data?.data ??
        response.data?.stats ??
        {};

      setStats(dashboardData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Check your admin login and backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load when the page opens and refresh automatically every 30 seconds.
  useEffect(() => {
    loadDashboard(true);

    const intervalId = setInterval(() => {
      loadDashboard(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadDashboard]);

  if (loading) {
    return (
      <main className="admin-dashboard-page">
        <div className="ad-loading">Loading dashboard...</div>
      </main>
    );
  }

  if (error && !stats) {
    return (
      <main className="admin-dashboard-page">
        <div className="ad-error">
          <p>{error}</p>
          <button onClick={() => loadDashboard(true)}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const cards = [
    {
      label: "Today's Orders",
      value: stats?.todayOrders ?? 0,
      icon: "🛍️",
      color: "red",
    },
    {
      label: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      icon: "⏳",
      color: "orange",
    },
    {
      label: "Delivered Orders",
      value:
        stats?.deliveredOrders ??
        stats?.completedOrders ??
        0,
      icon: "✓",
      color: "green",
    },
    {
      label: "Cancelled Orders",
      value: stats?.cancelledOrders ?? 0,
      icon: "×",
      color: "gray",
    },
    {
      label: "Returned / Refunds",
      value: stats?.returnedOrders ?? 0,
      icon: "↩",
      color: "teal",
    },
    {
      label: "Today's Revenue",
      value: money(stats?.todayRevenue),
      icon: "₹",
      color: "purple",
    },
  ];

  return (
    <main className="admin-dashboard-page">
      <div className="ad-container">
        <header className="ad-page-header">
          <div>
            <span className="ad-eyebrow">
              FRESHNEST ADMINISTRATION
            </span>

            <h1>Dashboard</h1>

            <p>
              Monitor today's orders, returns and business performance.
            </p>
          </div>

          <button
            className="ad-refresh-button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            type="button"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </header>

        {error && (
          <div className="ad-inline-error" role="alert">
            {error}
            <button
              type="button"
              onClick={() => loadDashboard(true)}
            >
              Retry
            </button>
          </div>
        )}

        <section className="ad-welcome">
          <div>
            <span>ADMIN OVERVIEW</span>

            <h2>Welcome to FreshNest</h2>

            <p>
              Manage products, process customer orders and review
              daily performance from one place.
            </p>
          </div>

          <div className="ad-welcome-icon">🍗</div>
        </section>

        <section className="ad-stats-grid">
          {cards.map((card) => (
            <article
              className="ad-stat-card"
              key={card.label}
            >
              <div className={`ad-stat-icon ${card.color}`}>
                {card.icon}
              </div>

              <div className="ad-stat-content">
                <p>{card.label}</p>
                <h2>{card.value}</h2>
              </div>
            </article>
          ))}
        </section>

        <p className="ad-live-note">
          Statistics refresh automatically every 30 seconds.
        </p>

        <section className="ad-quick-links">
          <Link
            to="/admin/products"
            className="ad-quick-link"
          >
            <span>📦</span>

            <div>
              <strong>Manage Products</strong>
              <p>
                Add products, change prices and update availability.
              </p>
            </div>

            <span className="ad-arrow">→</span>
          </Link>

          <Link
            to="/admin/orders"
            className="ad-quick-link"
          >
            <span>🚚</span>

            <div>
              <strong>Manage Orders</strong>
              <p>
                Review orders, delivery status, returns and refunds.
              </p>
            </div>

            <span className="ad-arrow">→</span>
          </Link>

          <Link
            to="/admin/reports"
            className="ad-quick-link"
          >
            <span>📊</span>

            <div>
              <strong>Business Reports</strong>
              <p>
                Review daily statistics and download PDF reports.
              </p>
            </div>

            <span className="ad-arrow">→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}