import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GroupIcon, LogOut, MessageSquare, Search, User, Users, X } from "lucide-react";
import { useState } from "react";
import NewDm from "./NewDm";
import NewContact from "./NewContact";
import NewChannel from "./NewChannel";
import { RiProfileLine } from "react-icons/ri";
import { HOST, LOGOUT_ROUTES } from "@/utils/constant";
import { useMessages } from "@/context/MessagesContext";
import { apiClient } from "@/lib/api-client";

const Logo = ({ unifiedContacts }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { chatData, setChatType, setChatData, setMessages } = useMessages();

  const handleClick = (contact) => {
    setChatType(contact.isGroup ? "group" : "contact");

    if (!chatData || chatData._id !== contact._id) {
      setChatData(contact);
      setMessages([]);
    }
  };

  const filteredContacts = unifiedContacts?.filter((contact) => {
    const name = contact.contactName || contact.firstName || contact.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    <>
      <div className="relative">
        {searchOpen && (
          <div className="absolute -top-2 left-0 w-full z-50 px-4 py-3 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white/90 backdrop-blur-md shadow-lg rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
              <Search className="text-gray-500 w-5 h-5" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats or users..."
                autoFocus
                className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 text-gray-800"
              />

              <button
                onClick={() => setSearchOpen(false)}
                className="hover:text-red-500 text-gray-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {searchTerm && filteredContacts?.length > 0 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-3xl bg-white shadow-xl rounded-xl z-50 p-4 border border-gray-200">
            <div className="flex flex-col divide-y divide-gray-100 max-h-72 overflow-y-auto scroll-smooth">
              {filteredContacts.map((contact) => {
                const displayName =
                  contact.contactName ||
                  contact.name ||
                  contact.phoneNo ||
                  `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
                const infoLine = !contact.isGroup
                  ? contact.email || contact.phoneNo || "No contact info"
                  : "Group";
                return (
                  <div
                    key={contact._id}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 transition rounded-lg cursor-pointer"
                    onClick={() => {
                      handleClick(contact);
                      setSearchOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {contact.image ? (
                        <img
                          src={`${HOST}/${contact.image}`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-sm"
                        />
                      ) : contact.isGroup ? (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-11 w-11 flex items-center justify-center rounded-full text-white text-lg font-semibold shadow-inner">
                          #
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[#8338ec] font-semibold text-sm uppercase">
                          {(contact.contactName || contact.firstName || "U")[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {displayName}
                      </span>
                      <span className="text-xs text-gray-500">{infoLine}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <div className="flex items-center gap-3">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-purple-600"
            >
              <rect width="24" height="24" rx="6" fill="#8338ec" />
              <path
                d="M6 10C6 8.34315 7.34315 7 9 7H15C16.6569 7 18 8.34315 18 10V14C18 15.6569 16.6569 17 15 17H12.4142L10 19.4142V17H9C7.34315 17 6 15.6569 6 14V10Z"
                fill="white"
              />
            </svg>
            <span className="text-2xl font-bold tracking-wide text-[#8338ec]">
              Whisper
            </span>
          </div>

          {/* Right: Search + Menu */}
          <div className="flex items-center gap-3">
            {!searchOpen && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    <Search className="text-gray-600 w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Search</p>
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full hover:bg-gray-200 transition">
                <BsThreeDotsVertical className="text-xl text-gray-600" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuLabel className="text-gray-500">
                  Menu
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Tooltip delayDuration={400}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => navigate("/profile")}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                      >
                        <RiProfileLine className="w-4 h-4 text-[#8338ec]" />
                        <span>Profile</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Profile</p>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NewContact
                    trigger={
                      <div className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition">
                        <MessageSquare className="w-4 h-4 text-[#8338ec]" />
                        <span>Add contact</span>
                      </div>
                    }
                  />
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <NewChannel
                    trigger={
                      <div className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition">
                        <Users className="w-4 h-4 text-[#8338ec]" />
                        <span>New Gorup</span>
                      </div>
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Tooltip delayDuration={400}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
                      >
                        <LogOut className="w-4 h-4 text-[#8338ec]" />
                        <span>Log-out</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Log-out</p>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};

export default Logo;
