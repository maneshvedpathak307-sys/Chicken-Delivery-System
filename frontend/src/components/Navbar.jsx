import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const getUserId = (user) =>
  user?.id ?? user?.userId ?? user?.customerId ?? null;

const getSavedProfile = (user) => {
  const userId = getUserId(user);

  if (userId === null || userId === undefined) return null;

  try {
    const saved = localStorage.getItem(`freshNestProfile_${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Unable to read saved profile:", error);
    return null;
  }
};

function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileVersion((previous) => previous + 1);
    };

    window.addEventListener("customerProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener(
        "customerProfileUpdated",
        handleProfileUpdate
      );
    };
  }, []);

  // Re-read this user's saved profile after a profile update.
  const savedProfile = getSavedProfile(user);
  void profileVersion;

  const displayName =
    savedProfile?.name ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Customer";

  const profilePhoto =
    savedProfile?.photo ||
    user?.photo ||
    user?.photoUrl ||
    null;

  const closeMenus = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = async () => {
    closeMenus();

    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };

  const navLinkClass = ({ isActive }) =>
    `navbar-link${isActive ? " active" : ""}`;

  const accountHome = isAuthenticated
    ? isAdmin
      ? "/admin"
      : "/home"
    : "/";

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <Link
          to={accountHome}
          className="navbar-brand"
          onClick={closeMenus}
          aria-label="FreshNest home"
        >
          <span className="navbar-brand-icon" aria-hidden="true">
            🐔
          </span>

          <span className="navbar-brand-text">
            <strong>FreshNest</strong>
            <small>Chicken & Eggs</small>
          </span>
        </Link>

        <button
          type="button"
          className="navbar-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="navbar-navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="navbar-navigation"
          className={`navbar-navigation${menuOpen ? " open" : ""}`}
          aria-label="Main navigation"
        >
          {!isAuthenticated && (
            <>
              <NavLink
                to="/"
                end
                className={navLinkClass}
                onClick={closeMenus}
              >
                Home
              </NavLink>

              <NavLink
                to="/products"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Products
              </NavLink>

              <NavLink
                to="/login"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Login
              </NavLink>

              <Link
                to="/register"
                className="navbar-register-button"
                onClick={closeMenus}
              >
                Get Started <span aria-hidden="true">→</span>
              </Link>
            </>
          )}

          {isAuthenticated && !isAdmin && (
            <>
              <NavLink
                to="/home"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Home
              </NavLink>

              <NavLink
                to="/products"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Products
              </NavLink>

              <NavLink
                to="/cart"
                className={navLinkClass}
                onClick={closeMenus}
              >
                My Cart
              </NavLink>

              <NavLink
                to="/orders"
                className={navLinkClass}
                onClick={closeMenus}
              >
                My Orders
              </NavLink>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <>
              <NavLink
                to="/admin"
                end
                className={navLinkClass}
                onClick={closeMenus}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/admin/products"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Products
              </NavLink>

              <NavLink
                to="/admin/orders"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Orders
              </NavLink>

              <NavLink
                to="/admin/reports"
                className={navLinkClass}
                onClick={closeMenus}
              >
                Reports
              </NavLink>
            </>
          )}
        </nav>

        {isAuthenticated && (
          <div className="navbar-account">
            <button
              type="button"
              className="navbar-account-button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Open account menu"
            >
              <span className="navbar-avatar">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${displayName}'s profile`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <span className="navbar-account-label">
                <strong>{displayName}</strong>
                <small>{isAdmin ? "Administrator" : "Customer"}</small>
              </span>

              <span className="navbar-chevron" aria-hidden="true">
                ▾
              </span>
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  className="navbar-dropdown-backdrop"
                  aria-label="Close account menu"
                  onClick={() => setProfileOpen(false)}
                />

                <div className="navbar-dropdown">
                  {!isAdmin && (
                    <Link
                      to="/profile"
                      className="navbar-dropdown-item"
                      onClick={closeMenus}
                    >
                      <span aria-hidden="true">👤</span>
                      My Profile
                    </Link>
                  )}

                  <button
                    type="button"
                    className="navbar-dropdown-item navbar-logout"
                    onClick={handleLogout}
                  >
                    <span aria-hidden="true">↪</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;