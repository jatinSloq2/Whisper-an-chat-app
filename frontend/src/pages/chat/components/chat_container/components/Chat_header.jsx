import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constant";
import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useMessages } from "@/context/MessagesContext";
import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import { BsTelephone, BsCameraVideo } from "react-icons/bs";
import { useCall } from "@/context/CallContext";

const Chat_header = () => {
  const { startCall } = useCall()
  
  const {
    chatData,
    chatType,
    setChatData,
    setMessages,
    setChatType,
    setIsUploading,
    setIsDownloading,
    setFileUploadProgress,
    setFileDownloadProgress,
    setShowProfile,
  } = useMessages();

  const socket = useSocket();
  const { userInfo } = useAppStore();
  
  const closeChat = () => {
    setMessages([]);
    setChatType(undefined);
    setChatData(undefined);
    setIsUploading(false);
    setIsDownloading(false);
    setFileUploadProgress(0);
    setFileDownloadProgress(0);
  };
  
  const displayName =
  chatData?.contactName ||
  chatData?.phoneNo ||
  chatData?.contactEmail ||
  "Unnamed";
  
  const initiateCall = (type = "video") => {
    if (!chatData || !chatData._id) return;
    console.log("📞 Initiating call to", chatData._id, "as", type);
    startCall(chatData._id, type); 
  };
  
  
  
  return (
    <div className="h-[10vh] border-b border-gray-300 bg-gray-100 flex items-center justify-between px-6 md:px-20">
      <div className="flex items-center justify-between w-full">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (chatType && chatData) setShowProfile(true);
          }}
        >
          <div className="w-12 h-12 relative">
            <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-gray-200">
              <AvatarImage
                src={`${HOST}/${chatData.image}`}
                alt="profile-photo"
                className="object-cover h-full w-full bg-gray-100"
              />
            </Avatar>
          </div>
          <div className="text-gray-800 font-medium text-base">
            {chatType === "group" ? chatData?.name : displayName}
          </div>
        </div>
        {/* <div>
          <button
            className="text-gray-400 hover:text-black transition-colors duration-200"
            onClick={closeChat}
          >
            <RiCloseFill className="text-3xl" />
          </button>
        </div> */}
        <div className="flex items-center gap-4">
  <button
    className="text-gray-500 hover:text-green-600 transition"
    onClick={() => initiateCall("audio")}
    title="Voice Call"
  >
    <BsTelephone className="text-xl" />
  </button>
  <button
    className="text-gray-500 hover:text-blue-600 transition"
    onClick={() => initiateCall("video")}
    title="Video Call"
  >
    <BsCameraVideo className="text-xl" />
  </button>
  <button
    className="text-gray-400 hover:text-black transition-colors duration-200"
    onClick={closeChat}
  >
    <RiCloseFill className="text-3xl" />
  </button>
</div>
      </div>
    </div>
  );
};

export default Chat_header;
