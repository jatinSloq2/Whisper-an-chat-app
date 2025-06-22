import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Chat from "./pages/chat/Chat";
import Profile from "./pages/profile/Profile";
import { useAppStore } from "./store";
import { useEffect, useState } from "react";
import { apiClient } from "./lib/api-client";
import { GET_USER_INFO } from "./utils/constant";

function App() {
  
const ProtectedRoute = ({ children }) => {
  const { userInfo } = useAppStore();

  if (!userInfo) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

  const AuthRoute = ({ children }) => {
    const { userInfo } = useAppStore();
    const isAuthenticated = !!userInfo;
    return isAuthenticated ? <Navigate to={"/chat"} /> : children;
  };

  const [loading, setLoading] = useState(true);
  const { userInfo, fetchUserInfo } = useAppStore();

useEffect(() => {
  const load = async () => {
    if (!userInfo) await fetchUserInfo();
    setLoading(false);
  };
  load();
}, [userInfo, fetchUserInfo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={"/auth"} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
