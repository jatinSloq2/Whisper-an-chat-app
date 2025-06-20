import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import Lottie from "react-lottie";
import { animationDefaultOptions, getColor } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { HOST, SEARCH_CONTACTS } from "@/utils/constant";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store";
import { useMessages } from "@/context/MessagesContext"; 

const NewDm = () => {
  const { setChatType, setChatData, setMessages } = useMessages(); 

  const [openNewContactModal, setOpenNewContactModal] = useState(false);
  const [searchedContacts, setsearchedContacts] = useState([]);

  const searchContact = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const res = await apiClient.post(SEARCH_CONTACTS, { searchTerm });
        if (res.status === 200 && res.data.contacts) {
          setsearchedContacts(res.data.contacts);
        }
      } else {
        setsearchedContacts([]);
      }
    } catch (error) {
      console.error("Error searching contacts:", error);
    }
  };

  const selectContact = (contact) => {
    setOpenNewContactModal(false);
    setChatType("contact");
    setChatData(contact);
    setMessages([]);
    setsearchedContacts([]);
  };
  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <FaPlus
            className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 duration-300 transition-all"
            onClick={() => {
              setOpenNewContactModal(true);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new chat</p>
        </TooltipContent>
      </Tooltip>
      {/* {This */}

      <Dialog open={openNewContactModal} onOpenChange={setOpenNewContactModal}>
        <DialogContent className="bg-[#181920] border-none text-white w-[500px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Please select a contact</DialogTitle>
          </DialogHeader>
          <div>
            <Input
              placeholder="Sekect a contact"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={(e) => searchContact(e.target.value)}
            />
          </div>
          {searchedContacts.length > 0 && (
            <ScrollArea className="h-[250px]">
              <div className="flex flex-col gap-5">
                {searchedContacts.map((contact) => (
                  <div
                    className="flex gap-3 cursor-pointer items-center"
                    key={contact._id}
                    onClick={() => selectContact(contact)}
                  >
                    <div className="w-12 h-12 relative">
                      <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-white">
                        {contact.image ? (
                          <AvatarImage
                            src={`${HOST}/${contact.image}`}
                            alt="profile-photo"
                            className="object-cover h-full w-full bg-black"
                          />
                        ) : (
                          <div
                            className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                              contact.color
                            )} rounded-full`}
                          >
                            {contact.firstName
                              ? contact.firstName?.charAt(0)
                              : contact?.email?.charAt(0)}
                          </div>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex flex-col">
                      <span>
                        {" "}
                        {contact.firstName && contact.lastName
                          ? `${contact.firstName} ${contact.lastName}`
                          : contact.email}
                      </span>
                      <span className="text-xs">{contact.email}</span>
                    </div>
                  </div>
                ))}
              </div>{" "}
            </ScrollArea>
          )}
          {searchedContacts.length <= 0 && (
            <div className="flex-1 md:flex flex-col justify-center items-center duration-1000 transition-all">
              <Lottie
                isClickToPauseDisabled={true}
                height={100}
                width={100}
                options={animationDefaultOptions}
              />
              <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-10 lg:text-2xl  text-xl transition-all duration-300 text-center">
                <h3 className="ubuntu-medium">
                  Hi <span className="text-purple-500">! </span>Search Contacts
                </h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewDm;
