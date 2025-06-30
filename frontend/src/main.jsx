import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";
import { CallProvider } from "./context/CallContext";
import { ContactsProvider } from "./context/ContactContext";
import { MessagesProvider } from "./context/MessagesContext";
import { SettingsProvider } from "./context/SettingContext";
import { SocketProvider } from "./context/socketContext";
import { UIProvider } from "./context/UIcontext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <UIProvider>
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
  </UIProvider>
);
