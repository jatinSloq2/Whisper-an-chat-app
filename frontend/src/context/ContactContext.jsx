import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { GET_CONTACTS_DMS, GET_USER_GROUPS } from "@/utils/constant";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const { userInfo } = useAppStore();
  const [chatList, setChatList] = useState([]);

  const fetchChatList = async () => {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        apiClient.get(GET_CONTACTS_DMS),
        apiClient.get(GET_USER_GROUPS),
      ]);

      const contacts =
        contactsRes?.data?.contacts?.map((c) => ({
          ...c,
          type: "contact",
        })) || [];

      const groups =
        groupsRes?.data?.groups?.map((g) => ({
          ...g,
          type: "group",
        })) || [];

      setChatList([...contacts, ...groups]);
    } catch (err) {
      console.error("❌ Failed to fetch chats:", err);
      setChatList([]);
      toast.error("Failed to load chat list. Please try again.");
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchChatList();
    }
  }, [userInfo]);

  const upsertChatToTop = (chatItem) => {
    setChatList((prevList) => {
      const index = prevList.findIndex(
        (c) => c._id === chatItem._id && c.type === chatItem.type
      );

      let newList;
      if (index > -1) {
        const updated = [...prevList];
        const mergedItem = { ...updated[index], ...chatItem };
        updated.splice(index, 1);
        newList = [mergedItem, ...updated];
      } else {
        newList = [chatItem, ...prevList];
      }
      return newList.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessageTime || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
    });
  };

  return (
    <ContactsContext.Provider
      value={{
        upsertChatToTop,
        fetchChatList,
        chatList,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => useContext(ContactsContext);
