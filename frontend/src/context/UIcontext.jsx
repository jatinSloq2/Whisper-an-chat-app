import { createContext, useContext, useState } from "react";
const UIContext = createContext();
export const UIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isContactsLoading, setIsContactsLoading] = useState(false);

  return (
    <UIContext.Provider
      value={{
        isLoading,
        setIsLoading,
        isMessagesLoading,
        setIsMessagesLoading,
        isContactsLoading,
        setIsContactsLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
