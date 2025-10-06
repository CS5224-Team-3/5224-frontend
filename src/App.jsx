import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import SearchHeader from "./SearchHeader";
import ProfilePage from "./ProfilePage";
import PostDetailPage from "./PostDetailPage";
import { AuthProvider } from "./AuthProvider";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import PostCreate from "./PostCreate";
import Register from "./register";
import SearchResult from "./SearchResult";
const App = () => {
  return (
    <AuthProvider>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><SearchHeader /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="search-result" element={<SearchResult isSearchResult={true} />} />
          <Route path="create-post" element={<PostCreate />} />
          <Route path="edit/:id" element={<PostCreate />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="detail/:id" element={<PostDetailPage />} />
        </Route>
      </Routes>

    </AuthProvider>
  )
};
export default App;