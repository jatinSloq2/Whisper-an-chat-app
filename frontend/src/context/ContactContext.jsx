// context/ContactsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_CONTACTS_DMS, GET_USER_GROUPS } from "@/utils/constant";
import { useAppStore } from "@/store";
import { useMessages } from "./MessagesContext";

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const { userInfo } = useAppStore();
  const { messages } = useMessages();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);

  const fetchContacts = async () => {
    console.log("I am called");
    try {
      const res = await apiClient.get(GET_CONTACTS_DMS);
      if (res.data.contacts) {
        setContacts((prev) => [...res.data.contacts]); // ✅ fix
      }
      console.log("📥 Contacts fetched:", res.data.contacts);
    } catch (err) {
      console.error("❌ Failed to fetch contacts:", err);
      setContacts([]); // keep this
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get(GET_USER_GROUPS);
      if (res.data.groups) {
        setGroups((prev) => [...res.data.groups]); // ✅ fix
      }
    } catch (err) {
      console.error("❌ Failed to fetch groups:", err);
      setGroups([]); // keep this
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchContacts();
      fetchGroups();
    }
  }, [messages, userInfo]);

  const upsertContactToTop = (contact) => {
    console.log("💡 Upserting contact:", contact);
    setContacts((prevContacts) => {
      const index = prevContacts.findIndex((c) => c._id === contact._id);

      if (index > -1) {
        const updated = [...prevContacts];
        const mergedContact = { ...updated[index], ...contact };
        updated.splice(index, 1);
        return [mergedContact, ...updated];
      } else {
        return [contact, ...prevContacts];
      }
    });
  };

  const upsertGroupToTop = (group) => {
    setGroups((prevGroups) => {
      const index = prevGroups.findIndex((c) => c._id === group._id);
      if (index > -1) {
        const updated = [...prevGroups];
        const [existing] = updated.splice(index, 1);
        return [existing, ...updated];
      } else {
        return [group, ...prevGroups];
      }
    });
  };

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        groups,
        setGroups,
        upsertGroupToTop,
        upsertContactToTop,
        fetchContacts,
        fetchGroups,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => useContext(ContactsContext);
