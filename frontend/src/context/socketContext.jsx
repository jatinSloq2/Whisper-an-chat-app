import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import { createContext, useEffect, useRef, useContext, useState } from "react";
import { io } from "socket.io-client";
import { useMessages } from "@/context/MessagesContext";
import { useContacts } from "@/context/ContactContext";
import { toast } from "sonner";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { userInfo } = useAppStore();
  const { addMessage, chatType, chatData, setChatType, setChatData } =
    useMessages();
  const {
    fetchContacts,
    fetchGroups,
    upsertGroupToTop,
    upsertContactToTop,
    groups,
  } = useContacts();
  const [socketInstance, setSocketInstance] = useState(null);
  const chatDataRef = useRef(chatData);
  const chatTypeRef = useRef(chatType);
  const addMessageRef = useRef(addMessage);

  useEffect(() => {
    chatDataRef.current = chatData;
    chatTypeRef.current = chatType;
    addMessageRef.current = addMessage;
  }, [chatData, chatType, addMessage]);
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
      if (!message) return;

      const senderId =
        typeof message.sender === "object"
          ? message.sender._id
          : message.sender;
      const recipientId =
        typeof message.recipient === "object"
          ? message.recipient._id
          : message.recipient;
      const chatId = chatDataRef.current?._id || chatDataRef.current?.id;

      const isChatOpen =
        chatTypeRef.current === "contact" &&
        (chatId === senderId || chatId === recipientId);

      if (isChatOpen) {
        console.log("✅ Message matched and added", message);
        addMessageRef.current(message);
      } else {
        // ✅ Show toast if chat is not open
        const sender = message.sender?.firstName || "Someone";
        console.log(message);
        toast.success(`📩 New message from ${sender}`, {
          description:
            message.content.length > 50
              ? message.content.slice(0, 50) + "..."
              : message.content,
          action: {
            label: "View",
            onClick: () => {
              // Determine the contact object
              const contactObj =
                typeof message.sender === "object"
                  ? message.sender
                  : {
                      _id: message.sender,
                      firstName: "Unknown",
                      email: "",
                    };

              // 🟢 Set the current chat
              setChatType("contact");
              setChatData(contactObj);

              console.log("🔓 Chat opened via toast");
            },
          },
        });
      }

      // 🔄 Update contact list
      const contact =
        userInfo.id === senderId ? message.recipient : message.sender;
      const contactId = typeof contact === "object" ? contact._id : contact;

      upsertContactToTop({
        _id: contactId,
        lastMessage: message.content,
        updatedAt: new Date(),
        unread: !isChatOpen,
      });

      // Optionally refresh contacts
      const shouldRefetch =
        !socketRef.current.contactsCache ||
        !socketRef.current.contactsCache.includes(contactId);

      if (shouldRefetch) {
        fetchContacts().then(() => {
          socketRef.current.contactsCache = [
            ...(socketRef.current.contactsCache || []),
            contactId,
          ];
        });
      }
    });

    socket.on("receive-group-message", (message) => {
      if (!message) return;

      const groupId = message.groupId;
      const chatId = chatDataRef.current?._id || chatDataRef.current?.id;

      const isChatOpen = chatTypeRef.current === "group" && chatId === groupId;

      if (isChatOpen) {
        console.log("✅ Group message matched and added", message);
        addMessageRef.current(message);
      } else {
        console.log("📣 Group message received (toast triggered)", message);

        const fallbackName = message.groupName || message.name || "A group";

        // ✅ Always show a toast, fallback if name missing
        toast.success(`📢 New message in ${fallbackName}`, {
          description:
            message.content.length > 50
              ? message.content.slice(0, 50) + "..."
              : message.content,
          duration: 5000,
          action: {
            label: "View",
            onClick: () => {
              setChatType("group");
              setChatData({
                _id: groupId,
                name: fallbackName,
              });
              console.log("🔓 Group chat opened via toast");
            },
          },
        });
      }

      upsertGroupToTop({
        _id: groupId,
        lastMessage: message.content,
        updatedAt: new Date(),
      });

      fetchGroups();
    });

    return () => {
      socket.disconnect();
      setSocketInstance(null);
    };
  }, [userInfo, upsertGroupToTop, upsertContactToTop]);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};
