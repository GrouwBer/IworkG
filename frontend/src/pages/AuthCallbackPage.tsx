import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Handles OAuth redirect callback.
 * Extracts tokens from URL hash and stores them.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove #
    const params = new URLSearchParams(hash);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Autenticando...</p>
    </div>
  );
}
