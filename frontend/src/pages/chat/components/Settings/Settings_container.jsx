import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/context/SettingContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { HOST, LOGOUT_ROUTES } from "@/utils/constant";
import { useEffect, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SettingsActions from "./components/Actions";
import { ArrowLeft } from "lucide-react";

const Settings_container = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const {
    notification,
    setNotification,
    sound,
    setSound,
    theme,
    setTheme,
    language,
    setLanguage,
    setIsSettingsOpen,
  } = useSettings();

  const navigate = useNavigate();

  const fullName = `${userInfo.firstName?.trim()} ${userInfo.lastName?.trim()}`;
  const profileImage = `${HOST}/${userInfo.image}`;

  const [initialSettings, setInitialSettings] = useState(null);
  const [hasChanged, setHasChanged] = useState(false);

  // ⏳ Sync initial values when userInfo is loaded
  useEffect(() => {
    if (userInfo && userInfo.settings) {
      const init = {
        sound: userInfo.settings.sound,
        desktopNotifications: userInfo.settings.desktopNotifications,
        theme: userInfo.settings.theme,
        language: userInfo.language,
      };
      setInitialSettings(init);
      setSound(init.sound);
      setNotification(init.desktopNotifications);
      setTheme(init.theme);
      setLanguage(init.language);
    }
  }, [userInfo]);

  // 🔁 Detect change
  useEffect(() => {
    if (!initialSettings) return;

    const changed =
      sound !== initialSettings.sound ||
      notification !== initialSettings.desktopNotifications ||
      theme !== initialSettings.theme ||
      language !== initialSettings.language;

    setHasChanged(changed);
  }, [sound, notification, theme, language, initialSettings]);

  const handleSubmit = async () => {
    try {
      const res = await apiClient.patch(`/api/auth/settings`, {
        settings: {
          sound,
          desktopNotifications: notification,
          theme,
        },
        language,
      });

      if (res.data.success) {
        toast.success("Settings updated successfully.");
        setUserInfo((prev) => ({
          ...prev,
          settings: { sound, desktopNotifications: notification, theme },
          language,
        }));
        setInitialSettings({
          sound,
          desktopNotifications: notification,
          theme,
          language,
        });
        setHasChanged(false);
      } else {
        toast.error("Failed to update settings.");
      }
    } catch (err) {
      toast.error("Error updating settings.");
      console.error(err);
    }
  };

  const languageOtions = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ar", label: "Arabic" },
    { value: "ru", label: "Russian" },
    { value: "pt", label: "Portuguese" },
    { value: "bn", label: "Bengali" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "ur", label: "Urdu" },
    { value: "pa", label: "Punjabi" },
  ];

  const logout = async () => {
    try {
      const res = await apiClient.post(LOGOUT_ROUTES);
      if (res.status === 200) {
        window.location.href = "/auth";
      }
    } catch (error) {
      console.log(error);
    }
  };

  console.log(userInfo);
  const deleteAccount = async () => {
    alert("Delete Logic here");
  };

  return (
    <div className="fixed inset-0 md:static md:flex-1 bg-gray-100 text-black">
      <div className="relative flex flex-col h-full w-full">
        <Button
          variant="ghost"
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-4 left-4 z-50 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
        <div className="flex flex-col h-full">
          <div className="flex-1 bg-gray-100 dark:bg-neutral-900 md:flex flex-col justify-center items-center mt-30 md:mt-0 md:px-15 px-20 transition-all duration-500 ease-in-out z-100">
            <div className="w-full max-w-[500px] mx-auto px-6 py-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg space-y-8">
              {/* Profile Info */}
              <div
                className="flex items-center gap-4 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30 p-4 rounded-xl transition"
                onClick={() => navigate("/profile")}
              >
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400 dark:border-purple-600"
                />
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                    {fullName}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Tap to view profile
                  </p>
                </div>
                <FaChevronRight className="ml-auto text-purple-400 dark:text-purple-500" />
              </div>

              <hr className="border-neutral-300 dark:border-neutral-700" />

              {/* Toggles */}
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <Label className="text-neutral-800 dark:text-neutral-200">
                    Sound
                  </Label>
                  <Switch checked={sound} onCheckedChange={setSound} />
                </div>

                <div className="flex justify-between items-center">
                  <Label className="text-neutral-800 dark:text-neutral-200">
                    Desktop Notifications
                  </Label>
                  <Switch
                    checked={notification}
                    onCheckedChange={setNotification}
                  />
                </div>
              </div>

              {/* Select Dropdowns */}
              <div className="space-y-6">
                {/* Theme */}
                <div className="flex flex-col gap-1 text-purple-500">
                  <Label
                    htmlFor="theme"
                    className="text-neutral-800 dark:text-neutral-200"
                  >
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme" className="w-full">
                      <SelectValue placeholder="Select Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="flex flex-col gap-1 text-purple-500">
                  <Label
                    htmlFor="language"
                    className="text-neutral-800 dark:text-neutral-200"
                  >
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOtions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save Button */}
              {hasChanged && (
                <div className="text-right pt-4">
                  <Button
                    onClick={handleSubmit}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
              <SettingsActions logout={logout} deleteAccount={deleteAccount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings_container;
