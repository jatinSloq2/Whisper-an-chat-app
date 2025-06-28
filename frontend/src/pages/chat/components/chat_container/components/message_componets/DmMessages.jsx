import { HOST } from "@/utils/constant";
import CallMessageUI from "../CallMessage";
import { MdDone, MdDoneAll, MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";

const renderDmMessages = ({
  checkIfImage,
  message,
  setShowImage,
  setImageUrl,
  downloadFile,
  moment,
  userInfo,
}) => {
  const isSender = message.sender === userInfo.id;
  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}>
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

export default renderDmMessages;
