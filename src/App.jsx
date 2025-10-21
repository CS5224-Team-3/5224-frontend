// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import ProtectedRoute from "./ProtectedRoute";

import SearchHeader from "./SearchHeader";
// ⛳ 用你的主页面 SearchHomepage，替换原来的 Home
import SearchHomepage from "./SearchHomepage";
import SearchResult from "./SearchResult";
import PostCreate from "./PostCreate";
import PostDetailPage from "./PostDetailPage";
import ProfilePage from "./ProfilePage";
import Login from "./Login";
import Register from "./Register";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
      </Routes>
    </AuthProvider>
  );
};

export default App;
