import { Avatar } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiClient } from "@/lib/api-client";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST, LOGOUT_ROUTES } from "@/utils/constant";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Edit3 } from "lucide-react";
import React from "react";
import { IoPowerSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const Profile_Part = () => {
  const { userInfo} = useAppStore();
  const navigate = useNavigate();

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

  return (
    <div className="absolute bottom-0 h-16 flex items-center justify-between px-10 w-full bg-[#2a2b33] ">
      <div className="flex gap-3 items-center justify-center">
        <div className="w-12 h-12 relative">
          <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-white">
            {userInfo.image ? (
              <AvatarImage
                src={`${HOST}/${userInfo.image}`}
                alt="profile-photo"
                className="object-cover h-full w-full bg-black"
              />
            ) : (
              <div
                className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                  userInfo.color
                )} rounded-full`}
              >
                {userInfo.firstName
                  ? userInfo.firstName?.charAt(0)
                  : userInfo?.email?.charAt(0)}
              </div>
            )}
          </Avatar>
        </div>
        <div>
          {userInfo.firstName && userInfo.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : ""}
        </div>
      </div>
      <div className="flex gap-5">
        <Tooltip>
          <TooltipTrigger>
            <Edit3
              className="text-purple-500 text-xl font-medium"
              onClick={() => {
                navigate("/profile");
              }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Profile</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <IoPowerSharp
              className="text-red-500 text-xl font-medium"
              onClick={logout}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Log out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default Profile_Part;
