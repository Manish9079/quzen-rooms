import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import Orb from './Orb';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, authError, restoreSession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Orb size={64} />
      </div>
    );
  }

  if (authError) {
    return (
      <div role="alert" style={{ minHeight: '60vh', display: 'grid', placeContent: 'center', gap: 12, textAlign: 'center' }}>
        <p>Qyzen could not verify your session. Check your connection and try again.</p>
        <button type="button" onClick={restoreSession}>Retry</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
