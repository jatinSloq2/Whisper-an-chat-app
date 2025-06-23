import { useMessages } from "@/context/MessagesContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_MSG, HOST } from "@/utils/constant";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { toast } from "sonner";
const Message_container = () => {
  const scrollRef = useRef();

  const {
    chatType,
    chatData,
    messages,
    fetchMessages,
    fetchGroupMessages,
    setIsDownloading,
    setFileDownloadProgress,
  } = useMessages();
  const { userInfo } = useAppStore();
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (chatData?._id && chatType === "contact") {
      fetchMessages(chatData._id, chatType);
    } else if (chatData?._id && chatType === "group") {
      fetchGroupMessages(chatData._id, chatType);
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
      const currentDate = moment(message.timestamp).format("YYYY-MM-DD");
      const isNewDate = currentDate !== lastDate;
      lastDate = currentDate;

      return (
        <React.Fragment key={`${message._id || index}-${currentDate}`}>
          {isNewDate && (
            <div className="text-center my-4">
              <span className="inline-block bg-gray-200 text-gray-600 text-xs px-4 py-1 rounded-full shadow-sm">
                {moment(message.timestamp).format("LL")}
              </span>
            </div>
          )}

          {chatType === "contact"
            ? renderDmMessages(message)
            : renderGroupMessages(message)}
        </React.Fragment>
      );
    });
  };

  const checkIfImage = (filePath) => {
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
    return imageRegex.test(filePath);
  };

  const downloadFile = async (url) => {
    try {
      setIsDownloading(true);
      const response = await apiClient.get(`${HOST}/${url}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded * 100) / total);
          setFileDownloadProgress(percentCompleted);
        },
      });
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlBlob;
      link.setAttribute("download", url.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
      setIsDownloading(false);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderDmMessages = (message) => {
    const isSender = message.sender === userInfo.id;
    console.log(message);
    return (
      <div
        className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}
      >
        <div className="max-w-[70%]">
          <div
            className={`rounded-xl px-4 py-3 border text-sm shadow-sm break-words ${
              isSender
                ? "bg-purple-100 text-purple-800 border-purple-200"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {message.messageType === "text" && message.content}

            {message.messageType === "file" && (
              <>
                {checkIfImage(message.fileUrl) ? (
                  <img
                    src={`${HOST}/${message.fileUrl}`}
                    alt="sent"
                    className="rounded-md max-w-[250px] cursor-pointer"
                    onClick={() => {
                      setShowImage(true);
                      setImageUrl(message.fileUrl);
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <MdFolderZip className="text-2xl text-gray-500" />
                    <span>{message.fileUrl.split("/").pop()}</span>
                    <button
                      className="text-xl text-gray-600 hover:text-black"
                      onClick={() => downloadFile(message.fileUrl)}
                    >
                      <IoMdArrowRoundDown />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className={`text-xs mt-1 ${
              isSender ? "text-right text-gray-400" : "text-left text-gray-500"
            }`}
          >
            {moment(message.createdAt).format("LT")}
          </div>
        </div>
      </div>
    );
  };

  const renderGroupMessages = (message) => {
    console.log("messages fomr group", message);
    const isSender = message.sender._id === userInfo.id;
    const sender = message.sender;
    return (
      <div
        className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3`}
      >
        <div className="max-w-[70%]">
          {!isSender && (
            <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
              <Avatar className="h-6 w-6">
                {sender.image ? (
                  <AvatarImage
                    src={`${HOST}/${sender.image}`}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback
                    className={`uppercase text-sm ${getColor(sender.color)}`}
                  >
                    {sender.firstName?.charAt(0) || sender.email?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium text-gray-700">
                {`${sender.firstName} ${sender.lastName || ""}`}
              </span>
              <span className="text-xs">
                {moment(message.timestamp).format("LT")}
              </span>
            </div>
          )}

          <div
            className={`rounded-xl px-4 py-3 border text-sm shadow-sm break-words ${
              isSender
                ? "bg-purple-100 text-purple-800 border-purple-200"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {message.messageType === "text" && message.content}

            {message.messageType === "file" && (
              <>
                {checkIfImage(message.fileUrl) ? (
                  <img
                    src={`${HOST}/${message.fileUrl}`}
                    alt="sent"
                    className="rounded-md max-w-[250px] cursor-pointer"
                    onClick={() => {
                      setShowImage(true);
                      setImageUrl(message.fileUrl);
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <MdFolderZip className="text-2xl text-gray-500" />
                    <span>{message.fileUrl.split("/").pop()}</span>
                    <button
                      className="text-xl text-gray-600 hover:text-black"
                      onClick={() => downloadFile(message.fileUrl)}
                    >
                      <IoMdArrowRoundDown />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {isSender && (
            <div className="text-xs mt-1 text-right text-gray-400">
              {moment(message.createdAt).format("LT")}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {renderMessages()}
      <div ref={scrollRef}></div>

      {showImage && (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {renderMessages()}
          <div ref={scrollRef}></div>

          {showImage && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
              {/* 🔒 Floating buttons - OUTSIDE of image container */}
              <div className="fixed top-4 z-[110] flex gap-3">
                <button
                  className="bg-white/10 text-white p-3 text-xl rounded-full hover:bg-white/20 transition-all"
                  onClick={() => downloadFile(imageUrl)}
                >
                  <IoMdArrowRoundDown />
                </button>
                <button
                  className="bg-white/10 text-white p-3 text-xl rounded-full hover:bg-white/20 transition-all"
                  onClick={() => {
                    setImageUrl(null);
                    setShowImage(false);
                  }}
                >
                  <IoCloseSharp />
                </button>
              </div>

              {/* 🖼️ Image container */}
              <div className="relative w-fit max-w-[90vw] max-h-[85vh] p-4">
                <img
                  src={`${HOST}/${imageUrl}`}
                  alt="Preview"
                  className="rounded-lg shadow-lg object-contain max-h-[75vh] max-w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Message_container;
