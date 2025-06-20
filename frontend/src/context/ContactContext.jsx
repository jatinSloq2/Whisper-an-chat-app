// context/ContactsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_CONTACTS_DMS, GET_USER_GROUPS } from "@/utils/constant";

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);

  const addGroup = (group) => {
    setGroups((prev) => [...prev, group]);
  };

  const fetchContacts = async () => {
    const res = await apiClient.get(GET_CONTACTS_DMS);
    if (res.data.contacts) {
      setContacts(res.data.contacts);
    }
  };

  const fetchGroups = async () => {
    const res = await apiClient.get(GET_USER_GROUPS);
    if (res.data.groups) {
      setGroups(res.data.groups);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  return (
    <ContactsContext.Provider
      value={{ contacts, groups, addGroup, fetchGroups }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => useContext(ContactsContext);
