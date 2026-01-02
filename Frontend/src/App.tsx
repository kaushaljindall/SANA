import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DoctorConnect from './pages/DoctorConnect';
import PeerSupport from './pages/PeerSupport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LiveSession from './pages/LiveSession';
import AssessmentPage from './pages/AssessmentPage';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Only accessible when NOT logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        {/* Protected Routes - Require authentication */}
        <Route path="/" element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        } />
        <Route path="/doctor-connect" element={
          <ProtectedRoute>
            <DoctorConnect />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <PeerSupport />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/book-appointment" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="/assessment" element={
          <ProtectedRoute>
            <AssessmentPage />
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/session/:id" element={
          <ProtectedRoute>
            <LiveSession />
          </ProtectedRoute>
        } />

        {/* Default redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
