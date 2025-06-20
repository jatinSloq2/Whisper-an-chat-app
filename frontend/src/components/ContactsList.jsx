import { useAppStore } from "@/store";
import React from "react";

const ContactsList = ({ contacts, isChannel = false }) => {
  const {
    selectedChatType,
    setSelectedChatType,
    setSelectedChatData,
    setSelectedChatMessages,
  } = useAppStore();
  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else selectedChatType("contact");
    setSelectedChatData(contact);
    if (setSelectedChatData && setSelectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };
  return (
    <div className="mt-5">
      {contacts.map((contact, index) => (
        <div key={index} className="">
          {contact._id}
        </div>
      ))}
    </div>
  );
};

export default ContactsList;
