import { useEffect } from "react";
import { useMessages } from "@/context/MessagesContext";
import { useUI } from "@/context/UIcontext";
import Chat_header from "./components/Chat_header";
import MessageSkeleton from "@/components/MessagesSkeleton";
import Message_container from "./components/Message_container";
import User_profile from "./components/User_profile";
import Message_bar from "./components/Message_bar";

const Chat_container = () => {
  const { showProfile, fetchMessages, chatData, chatType } = useMessages();
  const { isMessagesLoading } = useUI();
  console.log(isMessagesLoading, "isLoading");

  useEffect(() => {
    if (chatData && chatType) {
      fetchMessages(chatData._id, chatType);
    }
  }, [chatData, chatType]);

  return (
    <div className="fixed inset-0 md:static md:flex-1 bg-gray-100 text-black">
      <div className="relative flex flex-col h-full w-full">
        <div className="flex flex-col h-full">
          <Chat_header />

          <div className="flex-1 flex justify-center overflow-y-auto">
            <div className="w-full xl:w-[85%] max-w-full h-full">
              {isMessagesLoading ? <MessageSkeleton /> : <Message_container />}
            </div>
          </div>

          <Message_bar />
        </div>

        {showProfile && (
          <div className="absolute top-0 right-0 h-full z-50">
            <User_profile />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat_container;
