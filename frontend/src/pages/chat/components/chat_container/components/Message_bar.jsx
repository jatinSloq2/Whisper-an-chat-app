import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import { useMessages } from "@/context/MessagesContext";
import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { apiClient } from "@/lib/api-client";
import { UPLOAD_FILE } from "@/utils/constant";

const Message_bar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const { userInfo } = useAppStore();
  const { chatType, chatData } = useMessages();
  const [message, setMessage] = useState("");
  const [showEmojiPickerOpen, setShowEmojiPickerOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (!socket) {
      console.warn("❌ No socket connection");
      return;
    }

    if (chatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: chatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (chatType === "group") {
      socket.emit("send-group-message", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        groupId: chatData._id,
      });
    }
    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient.post(UPLOAD_FILE, formData);
        if (res.status === 200 && res.data) {
          if (chatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: chatData._id,
              messageType: "file",
              fileUrl: res.data.filePath,
            });
          } else if (chatType === "group") {
            socket.emit("send-group-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: res.data.filePath,
              groupId: chatData._id,
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-[10vh] bg-gray-100 flex justify-center items-center px-8 mb-6 gap-6">
      <div className="flex-1 flex bg-neutral-300 rounded-md items-center gap-5 pr-5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-5 bg-transparent rounded-md focus:outline-none placeholder:text-black"
          placeholder="Type your message here..."
        />
        <button
          className="text-neutral-500 hover:text-white transition-all"
          onClick={handleAttachmentClick}
        >
          <GrAttachment className="text-2xl" />
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAttachmentChange}
        />
        <div className="relative">
          <button
            className="text-neutral-500 hover:text-white transition-all"
            onClick={() => setShowEmojiPickerOpen(!showEmojiPickerOpen)}
          >
            <RiEmojiStickerLine className="text-2xl" />
          </button>
          {showEmojiPickerOpen && (
            <div className="absolute bottom-16 right-0" ref={emojiRef}>
              <EmojiPicker
                theme="dark"
                onEmojiClick={handleAddEmoji}
                autoFocusSearch={false}
              />
            </div>
          )}
        </div>
      </div>
      <button
        className="bg-purple-500 rounded-md flex items-center justify-center p-5 hover:bg-purple-700 transition-all"
        onClick={handleSendMessage}
      >
        <IoSend className="text-2xl text-white" />
      </button>
    </div>
  );
};

export default Message_bar;
