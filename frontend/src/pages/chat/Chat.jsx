import { useAppStore } from "@/store"; // still for userInfo
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Contacts_container from "./components/contacts_container/Contacts_container";
import Empty_chat_container from "./components/empty_chats_container/Empty_chat_container";
import Chat_container from "./components/chat_container/Chat_container";
import { useMessages } from "@/context/MessagesContext";

const Chat = () => {
  const { userInfo } = useAppStore();
  const {
    chatType,
    isUploading,
    isDownloading,
    fileUploadProgress,
    fileDownloadProgress,
  } = useMessages();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast.error(
        "Please complete your profile setup before accessing the chat."
      );
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  return (
    <div className="flex h-[100vh] text-white overflow-hidden">
      {isUploading && (
        <div className="h-[100vh] w-[100vw] fixed top-0 left-0 z-50 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-lg">
          <h5 className="text-5xl animate-pulse"> Uploading File</h5>
          {fileUploadProgress}%
        </div>
      )}
      {isDownloading && (
        <div className="h-[100vh] w-[100vw] fixed top-0 left-0 z-50 bg-black/80 flex items-center justify-center flex-col gap-5 backdrop-blur-lg">
          <h5 className="text-5xl animate-pulse"> Downloading File</h5>
          {fileDownloadProgress}%
        </div>
      )}
      <Contacts_container />
      {chatType === undefined ? <Empty_chat_container /> : <Chat_container />}
    </div>
  );
};

export default Chat;
