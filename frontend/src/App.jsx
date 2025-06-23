import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppStore } from "./store";
import Auth from "./pages/auth/Auth";
import Chat from "./pages/chat/Chat";
import Profile from "./pages/profile/Profile";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [loading, setLoading] = useState(true);
  const { userInfo, fetchUserInfo } = useAppStore();


  useEffect(() => {
    const load = async () => {
      try {
        await fetchUserInfo();
      } catch (err) {
        console.error("API fetch failed", err);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 3500);
      }
    };
    load();
  }, []);
  useEffect(() => {
    if (
      "Notification" in window &&
      userInfo?.settings?.desktopNotifications &&
      Notification.permission === "default"
    ) {
      const handle = () => {
        Notification.requestPermission().then((permission) => {
          if (permission !== "granted") {
            console.warn("🚫 Notification permission denied");
          }
          window.removeEventListener("click", handle);
        });
      };
      window.addEventListener("click", handle);
    }
  }, [userInfo]);

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
