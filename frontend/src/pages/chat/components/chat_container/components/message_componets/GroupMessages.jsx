import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constant";
import { MdDone, MdDoneAll } from "react-icons/md";

const renderGroupMessages = ({
  checkIfImage,
  message,
  setShowImage,
  setImageUrl,
  downloadFile,
  moment,
  userInfo,
  chatType
}) => {
  const isSender = message.sender._id === userInfo.id;
  const sender = message.sender;
  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3`}>
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

export default renderGroupMessages;
