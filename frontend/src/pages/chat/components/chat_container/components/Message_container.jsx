import { useMessages } from "@/context/MessagesContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_MSG } from "@/utils/constant";
import moment from "moment";
import React, { useEffect, useRef } from "react";

const Message_container = () => {
  const scrollRef = useRef();

  const { chatType, chatData, messages, fetchMessages } = useMessages();
  const { userInfo } = useAppStore(); // optional - can move to auth context later

  useEffect(() => {
    if (chatData?._id && chatType === "contact") {
      fetchMessages(chatData._id, chatType);
    }
  }, [chatData?._id, chatType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const renderMessages = () => {
    let lastDate = null;
    return messages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {chatType === "contact" && renderDmMessages(message)}
        </div>
      );
    });
  };

  const renderDmMessages = (message) => {
    const isSender = message.sender === userInfo.id;

    return (
      <div className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
        <div
          className={`${
            isSender
              ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
              : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20"
          } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
        >
          {message.content}
          <div className="text-xs text-gray-600 text-right">
            {moment(message.timestamp).format("LT")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrolbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {renderMessages()}
      <div ref={scrollRef}></div>
    </div>
  );
};

export default Message_container;
