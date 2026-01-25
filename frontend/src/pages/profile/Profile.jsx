import { useAppStore } from "@/store";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  HOST,
  REMOVE_PROFILEIMAGE,
  UPDATE_USER_INFO,
  UPLOAD_PROFILE_IMAGE,
} from "@/utils/constant";
import { Loader2, Check } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo, fetchUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userInfo?.profileSetup) {
      setFirstName(userInfo.firstName || "");
      setLastName(userInfo.lastName || "");
      setSelectedColor(userInfo.color ?? 0);
    }
    if (userInfo.image) {
      setImage(userInfo.image);
    }
  }, [
    userInfo.firstName,
    userInfo.lastName,
    userInfo.image,
    userInfo.color,
    userInfo.profileSetup,
  ]);

  // Track changes
  useEffect(() => {
    const changed =
      firstName !== (userInfo.firstName || "") ||
      lastName !== (userInfo.lastName || "") ||
      selectedColor !== (userInfo.color ?? 0);
    setHasChanges(changed);
  }, [firstName, lastName, selectedColor, userInfo]);

  const validateProfile = () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (selectedColor === undefined) {
      toast.error("Color is required");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);
    try {
      const res = await apiClient.put(UPDATE_USER_INFO, {
        firstName,
        lastName,
        color: selectedColor,
      });

      if (res.status === 200) {
        setUserInfo((prev) => ({
          ...prev,
          firstName: res.data.user.firstName,
          lastName: res.data.user.lastName,
          color: res.data.user.color,
          profileSetup: true,
        }));
        toast.success("Profile updated successfully");
        setHasChanges(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileInputClick = () => {
    if (isUploadingImage || isDeletingImage) return;
    fileInputRef.current.click();
  };

  const imageChangeHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    setIsUploadingImage(true);
    try {
      const res = await apiClient.put(UPLOAD_PROFILE_IMAGE, formData);
      if (res.status === 200 && res.data?.image) {
        setUserInfo((prev) => ({
          ...prev,
          image: res.data.image,
        }));

        setImage(res.data.image);
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (isDeletingImage) return;

    setIsDeletingImage(true);
    try {
      const res = await apiClient.delete(REMOVE_PROFILEIMAGE);
      if (res.status === 200) {
        await fetchUserInfo();
        toast.success("Image removed successfully");
      }
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error(error.response?.data?.message || "Failed to remove image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const isDefaultImage =
    userInfo.image === "uploads/profiles/profile-picture.png";

  const isAnyLoading = isSaving || isUploadingImage || isDeletingImage;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Back Icon */}
      <div className="w-full max-w-5xl mb-8">
        <IoArrowBack
          className="text-4xl text-black/80 cursor-pointer hover:text-purple-600 transition-colors duration-200"
          onClick={() => navigate("/chat")}
        />
      </div>

      {/* Header */}
      <div className="w-full max-w-5xl mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Customize your profile information and avatar
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Avatar */}
            <div
              className="relative"
              onMouseEnter={() => !isAnyLoading && setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Avatar className="h-48 w-48 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg">
                <AvatarImage
                  src={
                    image === "uploads/profiles/profile-picture.png"
                      ? `${HOST}/uploads/profiles/profile-picture.png`
                      : image
                  }
                  alt="profile-photo"
                  className="object-cover h-full w-full bg-gray-200"
                />
              </Avatar>

              {/* Loading Spinner Overlay */}
              {(isUploadingImage || isDeletingImage) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                    <p className="text-white text-sm">
                      {isUploadingImage ? "Uploading..." : "Removing..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Hover Overlay */}
              {hovered && !isUploadingImage && !isDeletingImage && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer transition-all duration-200 hover:bg-black/60"
                  onClick={
                    isDefaultImage ? handleFileInputClick : handleDeleteImage
                  }
                >
                  {isDefaultImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <FaPlus className="text-white text-3xl" />
                      <p className="text-white text-xs">Add Photo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FaTrash className="text-white text-3xl" />
                      <p className="text-white text-xs">Remove Photo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={imageChangeHandler}
              name="profileImage"
              accept=".png, .jpg, .jpeg, .svg, .webp"
            />

            <p className="text-sm text-gray-500 text-center max-w-xs">
              Click on the avatar to {isDefaultImage ? "upload" : "remove"} your
              profile picture
            </p>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col justify-center gap-6 text-black">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                placeholder="Email"
                value={userInfo.email || ""}
                disabled
                className="rounded-full p-5 bg-gray-100 border border-gray-300 text-black cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <Input
                placeholder="Phone No"
                value={userInfo.phoneNo || ""}
                disabled
                className="rounded-full p-5 bg-gray-100 border border-gray-300 text-black cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-full px-6 py-4"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-full px-6 py-4"
                disabled={isSaving}
              />
            </div>

            <Button
              className="rounded-full p-6 mt-4 relative"
              onClick={saveChanges}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : hasChanges ? (
                "Save Changes"
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  All Saved
                </>
              )}
            </Button>

            {isSaving && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">
                  Updating your profile...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;