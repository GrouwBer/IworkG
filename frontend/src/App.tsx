import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import RequestDetailPage from './pages/RequestDetailPage';
import ContactsPage from './pages/ContactsPage';
import FavoritesPage from './pages/FavoritesPage';
import ProviderRegisterPage from './pages/ProviderRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/otp" element={<OTPPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes */}
          <Route path="/buscar" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/pedido/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
          <Route path="/contatos" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/register/provider" element={<ProtectedRoute><ProviderRegisterPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/buscar" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
