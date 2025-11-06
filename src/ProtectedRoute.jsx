import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, initialized } = useAuth();

  if (!initialized) {
    // 这里可以放个骨架屏/Loading
    return null;
  }
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
