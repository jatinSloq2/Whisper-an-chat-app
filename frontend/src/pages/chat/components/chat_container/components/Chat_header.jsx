import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import React from "react";
import { RiCloseFill } from "react-icons/ri";
const Chat_header = () => {
  const { closeChat, selectedChatData, selectedChatType } = useAppStore();

  return (
    <div className="h-[10vh]  border-b-2 border-[#2f303b] flex items-center justify-between px-20">
      <div className="flex gap-5 items-center w-full justify-between">
        <div className="flex gap-3 items-center justify-center">
          <div className="w-12 h-12 relative">
            <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-white">
              {selectedChatData.image ? (
                <AvatarImage
                  src={`${HOST}/${selectedChatData.image}`}
                  alt="profile-photo"
                  className="object-cover h-full w-full bg-black"
                />
              ) : (
                <div
                  className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                    selectedChatData.color
                  )} rounded-full`}
                >
                  {selectedChatData.firstName
                    ? selectedChatData.firstName?.charAt(0)
                    : selectedChatData?.email?.charAt(0)}
                </div>
              )}
            </Avatar>
          </div>
          <div>
            {selectedChatType === "contact" && selectedChatData.firstName
              ? `${selectedChatData.firstName}  ${selectedChatData.lastName} `
              : selectedChatData.email}
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
