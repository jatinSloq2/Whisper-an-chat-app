import React from "react";
import { useMessages } from "@/context/MessagesContext";
import { HOST } from "@/utils/constant";
import { RiCloseLine } from "react-icons/ri";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { MdBlock } from "react-icons/md";
import { MdReportGmailerrorred } from "react-icons/md";
import { Button } from "@/components/ui/button";
const User_profile = () => {
  const { chatData, chatType, setShowProfile } = useMessages();

  if (!chatData) return null;

  const renderUserAvatar = (user) => {
    return (
      <>
        <AvatarImage
          src={`${HOST}/${user.image}`}
          className="object-cover h-full w-full"
          alt="User"
        />
      </>
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full max-w-5xl md:max-w-[800px] bg-gray-50 border-l border-gray-200 z-50 px-5 py-4 shadow-2xl">
      {/* Close button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowProfile(false)}
          className="text-gray-500 hover:text-black transition-colors"
        >
          <RiCloseLine size={24} />
        </button>
      </div>

      {/* Group View */}
      {chatType === "group" ? (
        <div>
          <h2 className="text-black text-xl font-bold mb-4">{chatData.name}</h2>

          <p className="text-sm text-gray-600 mb-2 font-medium">Admins:</p>
          <div className="flex flex-col gap-3 max-h-[30vh] overflow-auto pr-2">
            {chatData.admins?.map((admin) => (
              <div
                key={admin._id}
                className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg"
              >
                <Avatar className="h-9 w-9 rounded-full overflow-hidden border border-purple-500">
                  {renderUserAvatar(admin)}
                </Avatar>
                <div>
                  <div className="text-black text-sm">
                    {admin.firstName
                      ? `${admin.firstName} ${admin.lastName || ""}`
                      : admin.email}
                  </div>
                  {admin._id === chatData.admin && (
                    <span className="text-xs text-purple-600 font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-4 mb-2 font-medium">
            Members:
          </p>
          <div className="flex flex-col gap-3 max-h-[30vh] overflow-auto pr-2">
            {chatData.members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg"
              >
                <Avatar className="h-9 w-9 rounded-full overflow-hidden border border-purple-500">
                  {renderUserAvatar(member)}
                </Avatar>
                <div>
                  <div className="text-black text-sm">
                    {member.firstName
                      ? `${member.firstName} ${member.lastName || ""}`
                      : member.email}
                  </div>
                  {chatData.admins?.some(
                    (admin) => admin._id === member._id
                  ) && (
                    <span className="text-xs text-purple-600 font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-4 gap-3">
          <Avatar className="h-20 w-20 rounded-full border-2 border-purple-500">
            <AvatarImage
              src={`${HOST}/${chatData.image}`}
              className="object-cover w-full h-full"
            />
          </Avatar>
          <div className="text-black text-xl font-semibold text-center">
            {chatData.contactName ||
              `~${chatData.firstName} ${chatData.lastName}` ||
              chatData.phoneNo}
          </div>
          <div className="text-sm text-gray-600 text-center">
            Email: {chatData.email || "N/A"}
          </div>
          <div className="text-sm text-gray-600 text-center">
            Phone: {chatData.phoneNo || "N/A"}
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              className="bg-white text-xs flex items-center justify-center gap-2 font-semibold rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition-all"
              onClick={() => alert("Block user logic here")}
            >
              <MdBlock className="text-base" />
              Block User
            </Button>

            <Button
              className="bg-white text-xs flex items-center justify-center gap-2 font-semibold rounded-lg border border-purple-500 text-purple-600 hover:bg-purple-50 transition-all"
              onClick={() => alert("Report user logic here")}
            >
              <MdReportGmailerrorred className="text-base" />
              Report User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default User_profile;
