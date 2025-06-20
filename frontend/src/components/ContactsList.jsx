import React from "react";
import { useMessages } from "@/context/MessagesContext";
import { Avatar, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constant";
import { getColor } from "@/lib/utils";

const ContactsList = ({ contacts, isChannel = false }) => {
  const {
    chatType,
    chatData,
    setChatType,
    setChatData,
    setMessages,
  } = useMessages();

  const handleClick = (contact) => {
    if (isChannel) {
      setChatType("channel");
    } else {
      setChatType("contact");
    }

    if (!chatData || chatData._id !== contact._id) {
      setChatData(contact);
      setMessages([]); 
    }
  };

  return (
    <div className="mt-5">
      {contacts.map((contact, index) => (
        <div
          key={index}
          onClick={() => handleClick(contact)}
          className={`pl-10 transition-all duration-300 cursor-pointer ${
            chatData && chatData._id === contact._id
              ? "bg-[#8417ff] hover:bg-[#8417ff]"
              : "hover:bg-[#f1f1f111]"
          }`}
        >
          <div className="flex gap-5 items-center justify-start text-neutral-300 py-3">
            {!isChannel && (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden border border-white">
                {contact.image ? (
                  <AvatarImage
                    src={`${HOST}/${contact.image}`}
                    alt="profile-photo"
                    className="object-cover h-full w-full bg-black"
                  />
                ) : (
                  <div
                    className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                      contact.color
                    )} rounded-full`}
                  >
                    {contact.firstName
                      ? contact.firstName.charAt(0)
                      : contact?.email?.charAt(0)}
                  </div>
                )}
              </Avatar>
            )}
            <span>
              {contact.firstName
                ? `${contact.firstName} ${contact.lastName ?? ""}`
                : contact.email}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactsList;
