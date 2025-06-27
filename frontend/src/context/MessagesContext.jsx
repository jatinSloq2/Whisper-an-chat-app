import { apiClient } from "@/lib/api-client";
import { GET_ALL_MSG_GROUP, GET_MSG } from "@/utils/constant";
import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUI } from "./UIcontext";

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const { setIsMessagesLoading } = useUI();
  const [messages, setMessages] = useState([]);
  const [chatType, setChatType] = useState(undefined);
  const [chatData, setChatData] = useState(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const fetchMessages = async (id, type, page = 1, appendTop = false) => {
    if (!id || !["contact", "group"].includes(type)) return;
    setIsMessagesLoading(true);

    try {
      const res =
        type === "contact"
          ? await apiClient.post(GET_MSG, { id, page })
          : await apiClient.get(`${GET_ALL_MSG_GROUP}`, {
              params: { groupId: id, page },
            });

      if (res.data.messages) {
        setMessages((prev) =>
          appendTop ? [...res.data.messages, ...prev] : res.data.messages
        );
        setHasMoreMessages(res.data.hasMore ?? false);
      }
    } catch (err) {
      if (!appendTop) setMessages([]);
      toast.error("Failed to fetch messages. Please try again later.");
      console.error("Fetch messages error:", err);
      setHasMoreMessages(false); // 🚨 don't keep it true on error
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const addMessage = (message) => {
    const isCall =
      message.messageType === "audio" || message.messageType === "video";

    const formattedMessage = {
      ...message,
      recipient:
        chatType === "group" ? message.recipient : message.recipient._id,
      sender: chatType === "group" ? message.sender : message.sender._id,
      isCall,
      callStatus: isCall ? message.callDetails?.status : null,
      callDuration: isCall ? message.callDetails?.duration : null,
      callStartTime: isCall ? message.callDetails?.startedAt : null,
      callEndTime: isCall ? message.callDetails?.endedAt : null,
    };

    setMessages((prevMessages) => [...prevMessages, formattedMessage]);
  };

  const updateMessageStatus = (messageId, newStatus) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId ? { ...msg, status: newStatus } : msg
      )
    );
  };

  const updateGroupMessageStatus = (messageId, userId, newStatus) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              statusMap: msg.statusMap.map((s) =>
                s.user === userId ? { ...s, status: newStatus } : s
              ),
            }
          : msg
      )
    );
  };

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      fetchMessages,
      addMessage,
      chatType,
      setChatType,
      chatData,
      setChatData,
      isUploading,
      setIsUploading,
      isDownloading,
      setIsDownloading,
      fileUploadProgress,
      setFileUploadProgress,
      fileDownloadProgress,
      setFileDownloadProgress,
      showProfile,
      setShowProfile,
      updateGroupMessageStatus,
      updateMessageStatus,
      hasMoreMessages,
      setHasMoreMessages,
    }),
    [
      messages,
      chatType,
      chatData,
      isUploading,
      isDownloading,
      fileUploadProgress,
      fileDownloadProgress,
      showProfile,
    ]
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => useContext(MessagesContext);
