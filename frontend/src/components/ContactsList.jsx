import { useMessages } from "@/context/MessagesContext";
import { useSettings } from "@/context/SettingContext";
import { getColor } from "@/lib/utils";
import NewDm from "@/pages/chat/components/contacts_container/components/NewDm";
import { HOST } from "@/utils/constant";
import moment from "moment";
import { Avatar, AvatarImage } from "./ui/avatar";

const ContactsList = ({ contacts }) => {
  const { chatData, setChatType, setChatData, setMessages, chatType } =
    useMessages();
  const { setIsSettingsOpen, isSettingsOpen } = useSettings();
  const handleClick = (contact) => {
    setChatType(contact.isGroup ? "group" : "contact");

    if (!chatData || chatData._id !== contact._id) {
      setChatData(contact);
      setMessages([]);
    }
    setIsSettingsOpen(false);
  };

  return (
    <div className="">
      {[...contacts]
        .sort((a, b) => {
          const timeA = new Date(
            a.updatedAt || a.lastMessageTime || 0
          ).getTime();
          const timeB = new Date(
            b.updatedAt || b.lastMessageTime || 0
          ).getTime();
          return timeB - timeA;
        })
        .map((contact, index) => {
          const isActive = chatData && chatData._id === contact._id;
          const displayName =
            contact.contactName ||
            contact.phoneNo ||
            contact.email ||
            contact.name ||
            "Unknown";

          const avatarLetter = displayName[0]?.toUpperCase() || "U";
          return (
            <div
              key={index}
              onClick={() => handleClick(contact)}
              className={`cursor-pointer flex items-center gap-4 px-4 py-3 transition-all duration-200 border-b-1 border-gray-300 ${
                isActive
                  ? "bg-purple-500 text-white shadow-sm"
                  : "text-purple-600"
              }`}
            >
              {/* Avatar */}

              <Avatar className="h-10 w-10 rounded-full border border-white/10 shadow-sm">
                {contact.image ? (
                  <AvatarImage
                    src={`${HOST}/${contact.image}`}
                    alt="profile"
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div
                    className={`uppercase h-full w-full flex items-center justify-center text-base ${getColor(
                      contact.color
                    )}`}
                  >
                    {avatarLetter}
                  </div>
                )}
              </Avatar>

              {/* Info */}
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium text-sm">{displayName}</p>
                <p className="text-xs text-black truncate group-hover:text-black">
                  {contact.lastMessage || "Tap to chat"}
                </p>
              </div>

              {/* Time */}
              <div className="text-[11px] text-black font-mono">
                {contact.lastMessageTime
                  ? moment(contact.lastMessageTime).format("hh:mm A")
                  : ""}
              </div>
            </div>
          );
        })}
      {!chatType && (
        <div
          className={`absolute bottom-10 right-5 flex-col gap-4 z-50
      ${isSettingsOpen ? "hidden md:flex" : "flex"}
    `}
        >
          <NewDm />
        </div>
      )}
    </div>
  );
};

export default ContactsList;
