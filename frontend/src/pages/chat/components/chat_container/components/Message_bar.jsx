import { useMessages } from "@/context/MessagesContext";
import { useSocket } from "@/context/socketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE } from "@/utils/constant";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";

const Message_bar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const { userInfo } = useAppStore();
  const [message, setMessage] = useState("");
  const [showEmojiPickerOpen, setShowEmojiPickerOpen] = useState(false);
  const { setIsUploading, setFileUploadProgress, chatType, chatData } =
    useMessages();

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

  const handleAddEmoji = (emoji) => setMessage((msg) => msg + emoji.emoji);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (!socket) {
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
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAttachmentChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        // Start uploading
        setIsUploading(true);
        setFileUploadProgress(0);

        const res = await apiClient.post(UPLOAD_FILE, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setFileUploadProgress(percentCompleted);
          },
        });

        if (res.status === 200 && res.data) {
          const fileUrl = res.data.filePath;

          if (chatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: chatData._id,
              messageType: "file",
              fileUrl,
            });
          } else if (chatType === "group") {
            socket.emit("send-group-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl,
              groupId: chatData._id,
            });
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setFileUploadProgress(0);
    }
  };

  return (
    <div className="h-auto px-4 py-3 md:px-8 md:py-0 bg-gray-100 flex flex-wrap md:flex-nowrap justify-center items-center gap-4 md:gap-6 mb-6">
      <div className="flex-1 flex bg-neutral-300 rounded-md items-center gap-2 md:gap-5 pr-2 md:pr-5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-3 md:p-5 bg-transparent rounded-md focus:outline-none placeholder:text-black text-sm md:text-base"
          placeholder="Type your message..."
        />
        <button
          className="text-neutral-500 hover:text-white transition-all"
          onClick={handleAttachmentClick}
        >
          <GrAttachment className="text-xl md:text-2xl" />
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
            <RiEmojiStickerLine className="text-xl md:text-2xl" />
          </button>
          {showEmojiPickerOpen && (
            <div className="absolute bottom-16 right-0 z-50" ref={emojiRef}>
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
        className="bg-purple-500 rounded-md p-3 md:p-5 flex items-center justify-center hover:bg-purple-700 transition-all"
        onClick={handleSendMessage}
      >
        <IoSend className="text-white text-xl md:text-2xl" />
      </button>
    </div>
  );
};

export default Message_bar;
