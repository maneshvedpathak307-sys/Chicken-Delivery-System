import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Send unauthenticated users to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Only administrators can access admin pages.
  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  // Prevent administrators from opening customer-only pages.
  if (!adminOnly && user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;