import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "./store";
import Auth from "./pages/auth/Auth";
import Chat from "./pages/chat/Chat";
import Profile from "./pages/profile/Profile";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [loading, setLoading] = useState(true); // Splash screen stays visible until everything is ready
  const { userInfo, fetchUserInfo } = useAppStore();

  useEffect(() => {
    const load = async () => {
      try {
        await fetchUserInfo(); 
      } catch (err) {
        console.error("API fetch failed", err);
      } finally {
        setTimeout(() => {
          setLoading(false); // Show splash for minimum time even if instant
        }, 2500); // Optional minimum splash duration
      }
    };
    load();
  }, []);

  const ProtectedRoute = ({ children }) => {
    const { userInfo } = useAppStore();
    if (!userInfo) return <Navigate to="/auth" replace />;
    return children;
  };

  const AuthRoute = ({ children }) => {
    const { userInfo } = useAppStore();
    return userInfo ? <Navigate to="/chat" /> : children;
  };

  if (loading) return <SplashScreen />;

  return (
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
  );
}

export default App;
