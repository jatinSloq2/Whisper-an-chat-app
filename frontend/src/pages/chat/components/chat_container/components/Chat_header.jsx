import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constant";
import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useMessages } from "@/context/MessagesContext";

const Chat_header = () => {
  const { chatData, chatType, setChatData, setChatType, setMessages } = useMessages();

  const closeChat = () => {
    setChatData(undefined);
    setChatType(undefined);
    setMessages([]);
  };

  return (
    <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-20">
      <div className="flex gap-5 items-center w-full justify-between">
        <div className="flex gap-3 items-center justify-center">
          <div className="w-12 h-12 relative">
            <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-white">
              {chatData?.image ? (
                <AvatarImage
                  src={`${HOST}/${chatData.image}`}
                  alt="profile-photo"
                  className="object-cover h-full w-full bg-black"
                />
              ) : (
                <div
                  className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                    chatData?.color
                  )} rounded-full`}
                >
                  {chatData?.firstName
                    ? chatData.firstName.charAt(0)
                    : chatData?.email?.charAt(0)}
                </div>
              )}
            </Avatar>
          </div>
          <div>
            {chatType === "contact" && chatData?.firstName
              ? `${chatData.firstName}  ${chatData.lastName}`
              : chatData?.email}
          </div>
        </div>
        <div className="flex items-center justify-center gap-5">
          <button className="text-neutral-500 focus:outline-none focus:border-none focus:text-white duration-300 transition-all">
            <RiCloseFill className="text-3xl" onClick={closeChat} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat_header;
