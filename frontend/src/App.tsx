import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ForgotAccessPage from './pages/ForgotAccessPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import RequestDetailPage from './pages/RequestDetailPage';
import ContactsPage from './pages/ContactsPage';
import FavoritesPage from './pages/FavoritesPage';
import ProviderRegisterPage from './pages/ProviderRegisterPage';
import ProviderProfilePage from './pages/ProviderProfilePage';
import ProviderEditPage from './pages/ProviderEditPage';
import MyProviderPage from './pages/MyProviderPage';
import HelpPage from './pages/HelpPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RequestBoardPage from './pages/RequestBoardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/otp" element={<OTPPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/recuperar" element={<ForgotAccessPage />} />

          {/* Protected routes */}
          <Route path="/buscar" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/pedido/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
          <Route path="/contatos" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/register/provider" element={<ProtectedRoute><ProviderRegisterPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/prestador/:id" element={<ProviderProfilePage />} />
          <Route path="/prestador/editar" element={<ProtectedRoute><ProviderEditPage /></ProtectedRoute>} />
          <Route path="/prestador/meu-perfil" element={<ProtectedRoute><MyProviderPage /></ProtectedRoute>} />
          <Route path="/mural" element={<ProtectedRoute><RequestBoardPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/categorias" element={<ProtectedRoute><AdminCategoriesPage /></ProtectedRoute>} />

          {/* Help & Legal */}
          <Route path="/ajuda" element={<HelpPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/buscar" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
