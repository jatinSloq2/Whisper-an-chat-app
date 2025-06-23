import React, { createContext, useContext, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_ALL_MSG_GROUP, GET_MSG } from "@/utils/constant";
import { toast } from "sonner";

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatType, setChatType] = useState(undefined);
  const [chatData, setChatData] = useState(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  const fetchMessages = async (chatId, type) => {
    if (!chatId || type !== "contact") return;
    try {
      const res = await apiClient.post(GET_MSG, { id: chatId });
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
      toast.error("Failed to fetch message please tyr again later")
    }
  };

  const fetchGroupMessages = async (grouId, type) => {
    if (!grouId || type !== "group") return;
    try {
      const res = await apiClient.get(`${GET_ALL_MSG_GROUP}`, {
        params: { groupId: grouId },
      });
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
      toast.error("Failed to fetch message please tyr again later")
    }
  };

  const addMessage = (message) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        ...message,
        recipient:
          chatType === "group" ? message.recipient : message.recipient._id,
        sender: chatType === "group" ? message.sender : message.sender._id,
      },
    ]);
  };

  return (
    <MessagesContext.Provider
      value={{
        messages,
        setMessages,
        fetchMessages,
        fetchGroupMessages,
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
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

// Access messages context anywhere
export const useMessages = () => useContext(MessagesContext);
