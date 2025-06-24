import React, { createContext, useState, useContext, useEffect } from "react";
import { useAppStore } from "@/store";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { userInfo } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(
    userInfo?.settings?.desktopNotifications ?? true
  );
  const [sound, setSound] = useState(userInfo?.settings?.sound);
  const [theme, setTheme] = useState(userInfo?.settings?.theme);
  const [language, setLanguage] = useState(userInfo?.language);
  const [about, setAbout] = useState(
    userInfo?.about ?? "Hey there I am using Whisper"
  );
  const [blockedUsers, setBlockedUsers] = useState(
    userInfo?.blockedUsers ?? []
  );

  useEffect(() => {}, [
    notification,
    sound,
    theme,
    language,
    about,
    blockedUsers,
  ]);

  return (
    <SettingsContext.Provider
      value={{
        isSettingsOpen,
        setIsSettingsOpen,
        notification,
        setNotification,
        sound,
        setSound,
        theme,
        setTheme,
        language,
        setLanguage,
        about,
        setAbout,
        blockedUsers,
        setBlockedUsers,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
