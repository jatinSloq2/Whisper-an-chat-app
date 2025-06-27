import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "@/context/MessagesContext";
import { useSocket } from "@/context/socketContext";
import { apiClient } from "@/lib/api-client";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constant";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { MdDone, MdDoneAll, MdFolderZip } from "react-icons/md";
import { toast } from "sonner";
import CallMessageUI from "./CallMessage";
const Message_container = () => {
  const socket = useSocket();
  const scrollRef = useRef();

  const {
    chatType,
    chatData,
    messages,
    setIsDownloading,
    setFileDownloadProgress,
    updateMessageStatus,
    updateGroupMessageStatus,
    hasMoreMessages,
    fetchMessages,
  } = useMessages();
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const { userInfo } = useAppStore();
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const containerRef = useRef(null);
  const topRef = useRef(null);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

useEffect(() => {
  if (!chatData || !chatType) return;
  fetchMessages(chatData._id, chatType, 1, false);
}, [chatData?._id, chatType]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    );

    const topEl = topRef.current;
    if (topEl) observer.observe(topEl);

    return () => {
      if (topEl) observer.unobserve(topEl);
    };
  }, [chatData, page]);

  useEffect(() => {
    setInitialScrollDone(false);
  }, [chatData?._id, chatType]);
  useEffect(() => {
    setPage(1);
  }, [chatData?._id]);
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({
        behavior: initialScrollDone ? "smooth" : "auto",
      });
      if (!initialScrollDone) setInitialScrollDone(true);
    }
  }, [messages]);
  useEffect(() => {
    if (!socket) return;

    messages.forEach((msg) => {
      if (
        chatType === "contact" &&
        msg.recipient === userInfo.id &&
        msg.status === "sent"
      ) {
        socket.emit("message-received", { messageId: msg._id });
      }

      if (
        chatType === "group" &&
        msg.statusMap?.some(
          (m) => m.user === userInfo.id && m.status === "sent"
        )
      ) {
        socket.emit("group-message-received", {
          messageId: msg._id,
          userId: userInfo.id,
        });
      }
    });
  }, [messages, socket]);

  const markAsRead = () => {
    if (!socket) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    if (
      chatType === "contact" &&
      lastMsg.recipient === userInfo.id &&
      lastMsg.status !== "read"
    ) {
      socket.emit("message-read", { messageId: lastMsg._id });
    }

    if (chatType === "group") {
      const userStatus = lastMsg.statusMap?.find((s) => s.user === userInfo.id);
      if (userStatus?.status !== "read") {
        socket.emit("group-message-read", {
          messageId: lastMsg._id,
          userId: userInfo.id,
        });
      }
    }
  };

  const loadMore = async () => {
    if (
      !chatData ||
      !hasMoreMessages ||
      isFetchingMore ||
      !containerRef.current
    )
      return;

    setIsFetchingMore(true);

    const prevScrollHeight = containerRef.current.scrollHeight;

    try {
      await fetchMessages(chatData._id, chatType, page + 1, true);
      setPage((prev) => prev + 1);
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const newHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = newHeight - prevScrollHeight;
      });
      console.log("Loaded page:", page + 1);
    } catch (err) {
      console.error("loadMore error:", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    markAsRead();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageStatusUpdate = ({ messageId, status }) => {
      updateMessageStatus(messageId, status);
    };
    const handleGroupMessageStatusUpdate = ({ messageId, userId, status }) => {
      updateGroupMessageStatus(messageId, userId, status);
    };
    socket.on("messageStatusUpdate", handleMessageStatusUpdate);
    socket.on("groupMessageStatusUpdate", handleGroupMessageStatusUpdate);
    return () => {
      socket.off("messageStatusUpdate", handleMessageStatusUpdate);
      socket.off("groupMessageStatusUpdate", handleGroupMessageStatusUpdate);
    };
  }, [socket]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [messages]);

  const renderMessages = () => {
    let lastDate = null;

    return sortedMessages.map((message, index) => {
      const currentDate = moment(message.timestamp).format("YYYY-MM-DD");
      const isNewDate = currentDate !== lastDate;
      lastDate = currentDate;

      return (
        <React.Fragment key={`${message._id}-${index}`}>
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
            {["audio", "video"].includes(message.messageType) && (
              <CallMessageUI
                type={message.messageType}
                status={message.callDetails?.status}
                duration={message.callDetails?.duration}
                startedAt={message.callDetails?.startedAt}
              />
            )}
          </div>

          {isSender ? (
            <div className="text-xs mt-1 flex justify-end items-center gap-1 px-1">
              <span className="text-gray-500">
                {moment(message.createdAt).format("LT")}
              </span>
              {message.status === "sent" && (
                <MdDone className="text-gray-400 text-base" />
              )}
              {message.status === "received" && (
                <MdDoneAll className="text-gray-400 text-base" />
              )}
              {message.status === "read" && (
                <MdDoneAll className="text-purple-700 text-base" />
              )}
            </div>
          ) : (
            <div className="text-xs mt-1 flex justify-end items-center gap-1 px-1">
              <span className="text-gray-500">
                {moment(message.createdAt).format("LT")}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGroupMessages = (message) => {
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

            {chatType === "group" && isSender && (
              <div className="text-xs mt-1 text-right text-gray-400">
                Read by:{" "}
                {message.statusMap?.filter((m) => m.status === "read").length}{" "}
                members
              </div>
            )}
          </div>

          {isSender && (
            <div className="text-xs mt-1 flex justify-end items-center gap-1 px-1">
              <span className="text-gray-500">
                {moment(message.createdAt).format("LT")}
              </span>
              {(() => {
                const userStatus = message.statusMap?.find(
                  (s) => s.user === userInfo.id
                )?.status;

                if (userStatus === "sent") {
                  return <MdDone className="text-gray-400 text-base" />;
                } else if (userStatus === "received") {
                  return <MdDoneAll className="text-gray-400 text-base" />;
                } else if (userStatus === "read") {
                  return <MdDoneAll className="text-purple-700 text-base" />;
                } else {
                  return null;
                }
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {hasMoreMessages && <div ref={topRef} className="h-1"></div>}
        {renderMessages()}
        <div ref={scrollRef}></div>
      </div>

      {/* 🖼️ Image Preview Modal */}
      {showImage && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          {/* Floating Buttons */}
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

          {/* Image Container */}
          <div className="relative w-fit max-w-[90vw] max-h-[85vh] p-4">
            <img
              src={`${HOST}/${imageUrl}`}
              alt="Preview"
              className="rounded-lg shadow-lg object-contain max-h-[75vh] max-w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Message_container;
