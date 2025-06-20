import { useAppStore } from "@/store"; // still for userInfo
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Contacts_container from "./components/contacts_container/Contacts_container";
import Empty_chat_container from "./components/empty_chats_container/Empty_chat_container";
import Chat_container from "./components/chat_container/Chat_container";
import { useMessages } from "@/context/MessagesContext";

const Chat = () => {
  const { userInfo } = useAppStore(); // auth from Zustand
  const { chatType } = useMessages(); // chat type from context
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast.error("Please complete your profile setup before accessing the chat.");
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  return (
    <div className="flex h-[100vh] text-white overflow-hidden">
      <Contacts_container />
      {chatType === undefined ? <Empty_chat_container /> : <Chat_container />}
    </div>
  );
};

export default Chat;
