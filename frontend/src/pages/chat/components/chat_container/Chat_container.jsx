import React from "react";
import Chat_header from "./components/Chat_header";
import Message_bar from "./components/Message_bar";
import Message_container from "./components/Message_container";

const Chat_container = () => {
  return (
    <div className="fixed top-0 h-[100vh] bg-[#1b1c25] flex flex-col md:static md:flex-1">
      <Chat_header />
      <Message_container />
      <Message_bar />
    </div>
  );
};

export default Chat_container;
