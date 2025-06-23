import React from "react";
import Chat_header from "./components/Chat_header";
import Message_bar from "./components/Message_bar";
import Message_container from "./components/Message_container";
import User_profile from "./components/User_profile";
import { useMessages } from "@/context/MessagesContext";

const Chat_container = () => {
  const { showProfile } = useMessages();

  return (
    <div className="fixed inset-0 md:static md:flex-1 bg-gray-100 text-black">
      <div className="relative flex flex-col h-full w-full">
        {/* Main Chat Area */}
        <div className="flex flex-col h-full">
          <Chat_header />
          <Message_container />
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