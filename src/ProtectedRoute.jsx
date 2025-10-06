import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />; // 未登录跳转到登录页
  }

  return children; // 已登录渲染子路由
}
