import React, { createContext, useContext, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_MSG } from "@/utils/constant";

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatType, setChatType] = useState(undefined);
  const [chatData, setChatData] = useState(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileDownloadProgress, setFileDownloadProgress] = useState(0);
  
  // Fetch all messages for a specific chat
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
    }
  };

  // Add a new message (used by socket or local send)
  const addMessage = (message) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        ...message,
        recipient:
          chatType === "channel" ? message.recipient : message.recipient._id,
        sender: chatType === "channel" ? message.sender : message.sender._id,
      },
    ]);
  };

  return (
    <MessagesContext.Provider
      value={{
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
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

// Access messages context anywhere
export const useMessages = () => useContext(MessagesContext);
