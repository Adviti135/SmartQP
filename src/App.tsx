import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { QuestionBank } from './pages/QuestionBank';
import { GeneratePaper } from './pages/GeneratePaper';
import { PaperView } from './pages/PaperView';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QuestionBank />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GeneratePaper />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/papers/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaperView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
