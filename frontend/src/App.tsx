import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Scheduler from "./pages/Scheduler";
import ReportCard from "./pages/ReportCard";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 🛡️ Protected Route Group */}
        <Route element={<ProtectedRoute />}>
          {/* 👥 Master UI Layout Wrapper */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/report-card" element={<ReportCard />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>


    </BrowserRouter>
  );
}