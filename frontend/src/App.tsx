import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './shared/components/ProtectedRoute';
import OverviewPage from './features/overview/index';
import SubmitJobPage from './features/submitJob/index';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import { useWebSocket } from './shared/websocket/useWebSocket';


const App: React.FC = () => {
  // Ensure websocket only tries to connect when authenticated (you might need to update useWebSocket internally to respect this)
  useWebSocket(); 

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes (Sidebar & Layout included here) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/submit" element={<SubmitJobPage />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;
