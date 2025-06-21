import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import { createContext, useEffect, useRef, useContext, useState } from "react";
import { io } from "socket.io-client";
import { useMessages } from "@/context/MessagesContext";
import { useContacts } from "@/context/ContactContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { userInfo } = useAppStore();
  const { addMessage, chatType, chatData } = useMessages();
  const { upsertGroupToTop, upsertContactToTop } = useContacts();
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!userInfo) return;

    const socket = io(HOST, {
      query: { userId: userInfo.id },
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("✅ Connected to Socket Server");
    });

    socket.on("receiveMessage", (message) => {
      if (!chatData || !message) return;

      const senderId =
        typeof message.sender === "object"
          ? message.sender._id
          : message.sender;
      const recipientId =
        typeof message.recipient === "object"
          ? message.recipient._id
          : message.recipient;
      const chatId = chatData._id || chatData.id;

      if (
        chatType === "contact" &&
        (chatId === senderId || chatId === recipientId)
      ) {
        console.log("✅ Message matched and added", message);
        addMessage(message);
      } else {
        console.log("❌ Message ignored", message);
      }
      const contact =
        userInfo.id === senderId ? message.recipient : message.sender;
      upsertContactToTop({
        _id: typeof contact === "object" ? contact._id : contact,
        lastMessage: message.content,
        updatedAt: new Date(),
      });
    });

    socket.on("receive-group-message", (message) => {
      if (!chatData || !message) return;

      const groupId = message.groupId;
      const chatId = chatData._id || chatData.id;

      if (chatType === "group" && chatId === groupId) {
        console.log("✅ Group message matched and added", message);
        addMessage(message);
      } else {
        console.log("❌ Group message ignored", message);
      }
      upsertGroupToTop({
        _id: groupId,
        lastMessage: message.content,
        updatedAt: new Date(),
      });
    });

    return () => {
      socket.disconnect();
      setSocketInstance(null);
    };
  }, [userInfo, addMessage, chatType, chatData, upsertGroupToTop]);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};
