// context/ContactsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { GET_CONTACTS_DMS } from "@/utils/constant";

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await apiClient.get(GET_CONTACTS_DMS);
      if (res.data.contacts) {
        setContacts(res.data.contacts);
      }
    };
    fetchContacts();
  }, []);

  return (
    <ContactsContext.Provider value={{ contacts }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => useContext(ContactsContext);
