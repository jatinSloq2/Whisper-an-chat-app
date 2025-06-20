import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "sonner";
import { SocketProvider } from "./context/socketContext";
import { ContactsProvider } from "./context/ContactContext";
import { MessagesProvider } from "./context/MessagesContext";

createRoot(document.getElementById("root")).render(
    <StrictMode>
    <MessagesProvider> 
      <ContactsProvider>
        <SocketProvider>
          <App />
          <Toaster />
        </SocketProvider>
      </ContactsProvider>
    </MessagesProvider>
  </StrictMode>
);
