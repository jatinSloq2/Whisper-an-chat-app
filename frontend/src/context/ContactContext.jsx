// context/ContactsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_CONTACTS_DMS, GET_USER_GROUPS } from "@/utils/constant";
import { useAppStore } from "@/store";

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const {userInfo} = useAppStore()
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);

  const addGroup = (group) => {
    setGroups((prev) => [...prev, group]);
  };

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get(GET_CONTACTS_DMS);
      if (res.data.contacts) {
        setContacts(res.data.contacts);
      }
      console.log(res)
    } catch (err) {
      console.error("❌ Failed to fetch contacts:", err);
      setContacts([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get(GET_USER_GROUPS);
      if (res.data.groups) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error("❌ Failed to fetch groups:", err);
      setGroups([]);
    }
  };

  const upsertContactToTop = (contact) => {
    setContacts((prevContacts) => {
      const index = prevContacts.findIndex((c) => c._id === contact._id);
      if (index > -1) {
        const updated = [...prevContacts];
        const [existing] = updated.splice(index, 1);
        return [existing, ...updated];
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

  useEffect(() => {
  if (userInfo) {
    fetchContacts();
    fetchGroups();
  }
}, [userInfo]);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        groups,
        setGroups,
        upsertGroupToTop,
        upsertContactToTop,
        addGroup,
        fetchContacts,
        fetchGroups,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => useContext(ContactsContext);
