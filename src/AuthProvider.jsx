import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

const AuthContext = createContext({
  isLoggedIn: false,
  initialized: false,
  login: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 统一的检查函数：询问 Cognito 是否有当前用户
  const refreshAuth = async () => {
    try {
      await getCurrentUser();        // 有当前用户则不抛错
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setInitialized(true);
    }
  };

  // 首次加载时检查一次，避免首屏误判为未登录
  useEffect(() => {
    refreshAuth();
  }, []);

  // 登录后调用它即可刷新上下文（Login.jsx 成功 signIn 后调用）
  const login = async () => {
    await refreshAuth();
  };

  // 退出登录：调用 Cognito 的 signOut
  const logout = async () => {
    try {
      await signOut();
    } finally {
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, initialized, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
