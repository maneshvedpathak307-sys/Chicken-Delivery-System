import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// Public pages
import GuestHome from "./pages/GuestHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Error from "./pages/Error";

// Customer pages
import UserHome from "./pages/user/UserHome";
import Products from "./pages/user/Products";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Orders from "./pages/user/Orders";
import OrderDetails from "./pages/user/OrderDetails";
import Profile from "./pages/user/Profile";
import ReturnRequest from "./pages/user/ReturnRequest";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReports from "./pages/admin/AdminReports";
import AdminReturns from "./pages/admin/AdminReturns";

function RoleHomeRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <GuestHome />;
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/home" replace />;
}

function AppRoutes() {
  const location = useLocation();

  const routesWithNavbar = [
    "/",
    "/guest",
    "/login",
    "/register",
    "/products",
    "/home",
    "/cart",
    "/checkout",
    "/orders",
    "/profile",
    "/returns",
    "/admin",
    "/admin/products",
    "/admin/orders",
    "/admin/returns",
    "/admin/reports",
  ];

  const hideNavbar =
    location.pathname === "/unauthorized" ||
    (
      !routesWithNavbar.includes(location.pathname) &&
      !/^\/orders\/[^/]+$/.test(location.pathname)
    );

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/guest" element={<GuestHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/unauthorized"
          element={<Error />}
        />

        {/* Public product catalogue */}
        <Route
          path="/products"
          element={<Products />}
        />

        {/* Customer routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <UserHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <ReturnRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute adminOnly>
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/returns"
          element={
            <ProtectedRoute adminOnly>
              <AdminReturns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        {/* 404 page */}
        <Route
          path="*"
          element={<Error />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}