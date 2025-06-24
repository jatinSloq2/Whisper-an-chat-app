import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "sonner";
import { SocketProvider } from "./context/socketContext";
import { ContactsProvider } from "./context/ContactContext";
import { MessagesProvider } from "./context/MessagesContext";
import { SettingsProvider } from "./context/SettingContext";
import { CallProvider } from "./context/CallContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MessagesProvider>
      <ContactsProvider>
        <SettingsProvider>
          <SocketProvider>
            <CallProvider>
              <App />
              <Toaster />
            </CallProvider>
          </SocketProvider>
        </SettingsProvider>
      </ContactsProvider>
    </MessagesProvider>
  </StrictMode>
);
