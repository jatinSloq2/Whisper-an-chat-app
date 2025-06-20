import React, { createContext, useContext, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_MSG } from "@/utils/constant";

const MessagesContext = createContext();

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatType, setChatType] = useState(undefined); // "contact" | "channel"
  const [chatData, setChatData] = useState(undefined); // the selected contact/channel object

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
        sender:
          chatType === "channel" ? message.sender : message.sender._id,
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
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

// Access messages context anywhere
export const useMessages = () => useContext(MessagesContext);
