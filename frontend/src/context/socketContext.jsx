import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import { createContext, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        query: { userId: userInfo.id },
      });

      socket.current.on("connect", () => {
        console.log("Connected to Socket Server");
      });

      const handleReceiveMessage = (message) => {
        const { selectedChatType, selectedChatData, addMessage } =
          useAppStore.getState();

        if (!selectedChatData || !message) return;

        // Normalize sender and recipient IDs
        const senderId =
          typeof message.sender === "object"
            ? message.sender._id
            : message.sender;
        const recipientId =
          typeof message.recipient === "object"
            ? message.recipient._id
            : message.recipient;

        const chatId = selectedChatData._id || selectedChatData.id;

        if (
          selectedChatType === "contact" &&
          (chatId === senderId || chatId === recipientId)
        ) {
          console.log("✅ Message matched and added", message);
          addMessage(message);
        } else {
          console.log("❌ Message ignored", message);
        }
      };

      socket.current.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
