import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  // 🛡️ HARD GUARD: If credentials don't exist, intercept immediately before rendering ANY children
  if (!token || !storedUser || storedUser === "undefined") {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // ✅ Auth verified. Render the child component (the Dashboard) smoothly
  return <Outlet />;
}