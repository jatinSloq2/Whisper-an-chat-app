import { useAppStore } from "@/store";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { colors, getColor } from "@/lib/utils";
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

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo?.profileSetup) {
      setFirstName(userInfo.firstName || "");
      setLastName(userInfo.lastName || "");
      setSelectedColor(userInfo.color ?? 0);
    }
    if (userInfo.image) {
      const parts = userInfo.image.split("/");
      const encodedFileName = encodeURIComponent(parts.pop());
      const cleanPath = parts.join("/");
      setImage(`${HOST}/${cleanPath}/${encodedFileName}`);
    }
  }, [
    userInfo.firstName,
    userInfo.lastName,
    userInfo.image,
    userInfo.color,
    userInfo.profileSetup,
  ]);

  const validateProfile = () => {
    if (!firstName) return toast.error("First name is required");
    if (!lastName) return toast.error("Last name is required");
    if (selectedColor === undefined) return toast.error("Color is required");
    return true;
  };

  const saveChanges = async () => {
    if (!validateProfile()) return;

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
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const imageChangeHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await apiClient.put(UPLOAD_PROFILE_IMAGE, formData);
      console.log(res);

      if (res.status === 200 && res.data?.image) {
        setUserInfo((prev) => ({
          ...prev,
          image: res.data.image,
        }));

        const imagePath = res.data.image;
        const parts = imagePath.split("/");
        const encodedFileName = encodeURIComponent(parts.pop());
        const cleanPath = parts.join("/");
        setImage(`${HOST}/${cleanPath}/${encodedFileName}`);
        console.log(`${HOST}/${cleanPath}/${encodedFileName}`);
        toast.success("Image uploaded successfully");
        console.log("image", image);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };
  const handleDeleteImage = async () => {
    try {
      const res = await apiClient.delete(REMOVE_PROFILEIMAGE);
      if (res.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Image Removed Successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to remove image");
    }
  };

  return (
    <div className="bg-[#1b1c24] min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Back Icon */}
      <div className="w-full max-w-5xl mb-8">
        <IoArrowBack
          className="text-4xl text-white/90 cursor-pointer"
          onClick={() => navigate(-1)}
        />
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl gap-10">
        {/* Avatar + Color Picker */}
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Avatar */}
          <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Avatar className="h-48 w-48 rounded-full overflow-hidden border-4 border-white">
              {image ? (
                <AvatarImage
                  src={image}
                  alt="profile-photo"
                  className="object-cover h-full w-full bg-black"
                />
              ) : (
                <div
                  className={`uppercase h-full w-full text-6xl flex items-center justify-center ${getColor(
                    selectedColor
                  )} rounded-full`}
                >
                  {firstName ? firstName.charAt(0) : userInfo?.email?.charAt(0)}
                </div>
              )}
            </Avatar>

            {/* Hover Overlay */}
            {hovered && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                onClick={image ? handleDeleteImage : handleFileInputClick}
              >
                {image ? (
                  <FaTrash className="text-white text-3xl cursor-pointer" />
                ) : (
                  <FaPlus className="text-white text-3xl cursor-pointer" />
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
          {/* Color Selection */}
          <div className="flex gap-3 flex-wrap justify-center">
            {colors.map((color, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full cursor-pointer ${color} transition-all duration-200 ${
                  selectedColor === index ? "ring-2 ring-white" : ""
                }`}
                onClick={() => setSelectedColor(index)}
              />
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col justify-center gap-6 text-white">
          <Input
            placeholder="Email"
            value={userInfo.email}
            disabled
            className="rounded-lg p-5 bg-[#2c2e3b] border-none"
          />
          <Input
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg p-5 bg-[#2c2e3b] border-none"
          />
          <Input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg p-5 bg-[#2c2e3b] border-none"
          />
          <Button
            className="h-14 bg-purple-700 hover:bg-purple-900 transition-all duration-200"
            onClick={saveChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
