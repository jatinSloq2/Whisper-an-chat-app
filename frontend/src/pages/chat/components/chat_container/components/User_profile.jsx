import React from "react";
import { useMessages } from "@/context/MessagesContext";
import { HOST } from "@/utils/constant";
import { RiCloseLine } from "react-icons/ri";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";

const User_profile = () => {
  const { chatData, chatType, setShowProfile } = useMessages();
console.log("📄 chatData in User_profile", chatData);
  if (!chatData) return null;

  const renderUserAvatar = (user) => {
    return user.image ? (
      <AvatarImage
        src={`${HOST}/${user.image}`}
        className="object-cover h-full w-full"
        alt="User"
      />
    ) : (
      <div
        className={`uppercase text-sm flex items-center justify-center h-full w-full rounded-full ${getColor(
          user.color || 1
        )}`}
      >
        {(
          user.contactName ||
          user.firstName ||
          user.email ||
          user.phoneNo ||
          "U"
        )
          .charAt(0)
          .toUpperCase()}
      </div>
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[320px] bg-[#23252f] shadow-xl border-l border-neutral-700 z-50 px-5 py-4">
      <div className="flex justify-end">
        <button onClick={() => setShowProfile(false)} className="text-white">
          <RiCloseLine size={24} />
        </button>
      </div>

      {chatType === "group" ? (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">{chatData.name}</h2>

          <p className="text-sm text-neutral-400 mb-3">Admins:</p>
          <div className="flex flex-col gap-3 max-h-[70vh] overflow-auto pr-2">
            {chatData.admins?.map((admin) => (
              <div
                key={admin._id}
                className="flex items-center gap-3 bg-[#2b2d3a] p-2 rounded-lg"
              >
                <Avatar className="h-9 w-9 rounded-full overflow-hidden border">
                  {renderUserAvatar(admin)}
                </Avatar>
                <div>
                  <div className="text-white text-sm">
                    {admin.firstName
                      ? `${admin.firstName} ${admin.lastName || ""}`
                      : admin.email}
                  </div>
                  {admin._id === chatData.admin && (
                    <span className="text-xs text-yellow-400">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-400 mb-3">Members:</p>

          <div className="flex flex-col gap-3 max-h-[70vh] overflow-auto pr-2">
            {chatData.members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 bg-[#2b2d3a] p-2 rounded-lg"
              >
                <Avatar className="h-9 w-9 rounded-full overflow-hidden border">
                  {renderUserAvatar(member)}
                </Avatar>
                <div>
                  <div className="text-white text-sm">
                    {member.firstName
                      ? `${member.firstName} ${member.lastName || ""}`
                      : member.email}
                  </div>
                  {chatData.admins?.some(admin => admin._id === member._id) && (
                    <span className="text-xs text-yellow-400">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Else it's a CONTACT
        <div className="flex flex-col items-center mt-4 gap-3">
          <Avatar className="h-20 w-20 rounded-full border-2 border-white">
            {chatData.image ? (
              <AvatarImage
                src={`${HOST}/${chatData.image}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className={`uppercase text-3xl flex items-center justify-center h-full w-full rounded-full ${getColor(
                  chatData.color
                )}`}
              >
                {(chatData.contactName ||
                  chatData.phoneNo ||
                  chatData.email ||
                  "U")[0].toUpperCase()}
              </div>
            )}
          </Avatar>

          <div className="text-white text-xl font-semibold">
            {chatData.contactName || chatData.phoneNo || chatData.email}
          </div>

          <div className="text-sm text-gray-400">
            Email: {chatData.email || "N/A"}
          </div>
          <div className="text-sm text-gray-400">
            Phone: {chatData.phoneNo || "N/A"}
          </div>
        </div>
      )}
    </div>
  );
};

export default User_profile;
