import { useContacts } from "@/context/ContactContext";
import { useMessages } from "@/context/MessagesContext";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import { showWebNotification } from "@/utils/notify";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { userInfo } = useAppStore();
  const { addMessage, chatType, chatData, setChatType, setChatData } =
    useMessages();
  const {
    fetchChatList,
    upsertGroupToTop,
    upsertContactToTop,
    chatList,
    upsertChatToTop,
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
        addMessageRef.current(message);
      } else {
        const sender = message.sender?.firstName || "Someone";
        toast.success(`📩 New message from ${sender}`, {
          description:
            message.content.length > 50
              ? message.content.slice(0, 50) + "..."
              : message.content,
          action: {
            label: "View",
            onClick: () => {
              const contactId =
                typeof message.sender === "object"
                  ? message.sender._id
                  : message.sender;
              const fullContact = chatList.find(
                (c) => c._id === contactId || c.linkedUser?._id === contactId
              );
              const contactData = fullContact || {
                _id: contactId,
                firstName: message.sender?.firstName || "Unknown",
                email: message.sender?.email || "",
              };

              setChatType("contact");
              setChatData(contactData);

              console.log("🔓 Chat opened via toast");
            },
          },
        });
        showWebNotification({
          title: `New message from ${sender}`,
          body:
            message.content.length > 50
              ? message.content.slice(0, 50) + "..."
              : message.content,
          icon: message.sender?.image || "/logo.png",
          onClick: () => {
            const contactId =
              typeof message.sender === "object"
                ? message.sender._id
                : message.sender;

            const fullContact = chatList.find(
              (c) => c._id === contactId || c.linkedUser?._id === contactId
            );

            const contactData = fullContact || {
              _id: contactId,
              firstName: message.sender?.firstName || "Unknown",
              email: message.sender?.email || "",
            };

            setChatType("contact");
            setChatData(contactData);
          },
          enabled: userInfo?.settings?.desktopNotifications === true,
        });
      }
      const contact =
        userInfo.id === senderId ? message.recipient : message.sender;
      const contactId = typeof contact === "object" ? contact._id : contact;
      upsertChatToTop({
        _id: contactId,
        lastMessage: message.content,
        updatedAt: new Date(),
        unread: !isChatOpen,
        type: "contact",
      });
      const shouldRefetch =
        !socketRef.current.contactsCache ||
        !socketRef.current.contactsCache.includes(contactId);
      if (shouldRefetch) {
        fetchChatList().then(() => {
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
        addMessageRef.current(message);
      } else {
        const fallbackName = message.groupName || message.name || "A group";
        const fullGroup = chatList.find((g) => g._id === groupId);
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
              setChatData(
                fullGroup || {
                  _id: groupId,
                  name: fallbackName,
                  image: message.groupImage || "",
                }
              );
            },
          },
        });

        showWebNotification({
          title: `Group: ${fallbackName}`,
          body:
            message.content.length > 50
              ? message.content.slice(0, 50) + "..."
              : message.content,
          icon: message.groupImage || "/logo.png",
          onClick: () => {
            setChatType("group");
            setChatData(
              fullGroup || {
                _id: groupId,
                name: fallbackName,
                image: message.groupImage || "",
              }
            );
          },
          enabled: userInfo?.settings?.desktopNotifications === true,
        });
      }
      upsertChatToTop({
        _id: groupId,
        lastMessage: message.content,
        updatedAt: new Date(),
        unread: true,
        type: "group",
      });
      fetchChatList();
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
