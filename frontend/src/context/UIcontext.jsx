import { createContext, useContext, useState } from "react";

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <UIContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);