// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";

import SearchHeader from "./SearchHeader";
import SearchHomepage from "./SearchHomepage";
import SearchResult from "./SearchResult";
import PostCreate from "./PostCreate";
import PostDetailPage from "./PostDetailPage";
import ProfilePage from "./ProfilePage";
import Login from "./Login";
import Register from "./Register";
import ConfirmSignUp from "./ConfirmSignUp"; // ✅ 新增：验证码验证页

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* 公共路由：登录 / 注册 / 邮箱验证码验证 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* ✅ 新增的验证页面路由 */}
        <Route path="/confirm-signup" element={<ConfirmSignUp />} />

        {/* 需要登录的受保护路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SearchHeader />
            </ProtectedRoute>
          }
        >
          {/* 首页：使用 SearchHomepage */}
          <Route index element={<SearchHomepage />} />
          {/* 搜索结果页：读取 ?q= 并走搜索模式 */}
          <Route path="search-result" element={<SearchResult isSearchResult />} />
          <Route path="create-post" element={<PostCreate />} />
          <Route path="edit/:id" element={<PostCreate />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="detail/:id" element={<PostDetailPage />} />
        </Route>

        {/* 兜底：未知路径跳转到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
