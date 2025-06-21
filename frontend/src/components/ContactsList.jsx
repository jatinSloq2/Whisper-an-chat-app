import React from "react";
import { useMessages } from "@/context/MessagesContext";
import { Avatar, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constant";
import { getColor } from "@/lib/utils";

const ContactsList = ({ contacts, isGroup = false }) => {
  const { chatData, setChatType, setChatData, setMessages } = useMessages();

  const handleClick = (contact) => {
    if (isGroup) {
      setChatType("group");
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
      {contacts.map((contact, index) => {
        const isActive = chatData && chatData._id === contact._id;
        const displayName = contact.contactName
          ? contact.contactName
          : contact.firstName
          ? `${contact.firstName} ${contact.lastName ?? ""}`
          : contact.email;

        const avatarLetter = (contact.contactName ||
          contact.firstName ||
          contact.email ||
          "U")[0].toUpperCase();

        return (
          <div
            key={index}
            onClick={() => handleClick(contact)}
            className={`pl-10 transition-all duration-300 cursor-pointer ${
              isActive ? "bg-[#8417ff]" : "hover:bg-[#f1f1f111]"
            }`}
          >
            <div className="flex gap-5 items-center justify-start text-neutral-300 py-3">
              {!isGroup ? (
                <Avatar className="h-10 w-10 rounded-full overflow-hidden border border-white">
                  {contact.image ? (
                    <AvatarImage
                      src={`${HOST}/${contact.image}`}
                      alt="profile-photo"
                      className="object-cover h-full w-full bg-black"
                    />
                  ) : (
                    <div
                      className={`uppercase h-full w-full text-lg flex items-center justify-center rounded-full ${getColor(contact.color)}`}
                    >
                      {avatarLetter}
                    </div>
                  )}
                </Avatar>
              ) : (
                <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">
                  #
                </div>
              )}
              <span>{isGroup ? contact.name : displayName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactsList;
