// src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { AIEmployeeDemo } from './pages/demo/AIEmployeeDemo';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="demo" element={<AIEmployeeDemo />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        {/* Add other dashboard routes here */}
      </Route>
    </Routes>
  );
}

export default App;