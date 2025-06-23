import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constant";
import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useMessages } from "@/context/MessagesContext";

const Chat_header = () => {
  const {
    chatData,
    chatType,
    setChatData,
    setChatType,
    setMessages,
    setIsUploading,
    setIsDownloading,
    setFileUploadProgress,
    setFileDownloadProgress,
    setShowProfile,
  } = useMessages();

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

  const avatarLetter = (chatData?.contactName ||
    chatData?.email ||
    "U")[0].toUpperCase();

  return (
    <div className="h-[10vh] border-b border-gray-300 bg-gray-100 flex items-center justify-between px-6 md:px-20">
      <div className="flex items-center justify-between w-full">
        {/* Left: Avatar & Name */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (chatType && chatData) setShowProfile(true);
          }}
        >
          <div className="w-12 h-12 relative">
            {chatType === "contact" ? (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden border-2 border-purple-500">
                {chatData?.image ? (
                  <AvatarImage
                    src={`${HOST}/${chatData.image}`}
                    alt="profile-photo"
                    className="object-cover h-full w-full bg-gray-100"
                  />
                ) : (
                  <div
                    className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                      chatData?.color
                    )} text-white rounded-full`}
                  >
                    {avatarLetter}
                  </div>
                )}
              </Avatar>
            ) : (
              <div className="bg-purple-100 text-purple-600 h-10 w-10 flex items-center justify-center rounded-full text-xl font-semibold">
                #
              </div>
            )}
          </div>
          <div className="text-gray-800 font-medium text-base">
            {chatType === "group" ? chatData?.name : displayName}
          </div>
        </div>

        {/* Right: Close Button */}
        <div>
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
