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
import { useMessages } from "@/context/MessagesContext";

const NewDm = () => {
  const { setChatType, setChatData, setMessages } = useMessages();

  const [openNewContactModal, setOpenNewContactModal] = useState(false);
  const [searchedContacts, setsearchedContacts] = useState([]);

  const searchContact = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const res = await apiClient.post(SEARCH_CONTACTS, { searchTerm });
        console.log(res);
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
    const contactData = contact.isRegistered
      ? {
          ...contact.linkedUser,
          customName: contact.contactName,
          contactId: contact._id,
          isRegistered: true,
        }
      : {
          customName: contact.contactName,
          email: contact.contactEmail || null,
          phoneNo: contact.contactPhoneNo || null,
          contactId: contact._id,
          isRegistered: false,
        };

    setChatType("contact");
    setChatData(contactData);
    setMessages([]);
    setsearchedContacts([]);
    setOpenNewContactModal(false);
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
              placeholder="Select a contact"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={(e) => searchContact(e.target.value)}
            />
          </div>
          {searchedContacts.length > 0 && (
            <ScrollArea className="h-[250px]">
              <div className="flex flex-col gap-5">
                {searchedContacts.map((contact) => {
                  const isRegistered = contact.isRegistered;
                  const linked = contact.linkedUser;
                  const hasEmail = contact.contactEmail;
                  const hasPhone = contact.contactPhoneNo;

                  const handleClick = () => {
                    if (isRegistered) {
                      selectContact(contact);
                    } else if (hasEmail) {
                      window.location.href = `mailto:${hasEmail}?subject=Join%20Syncronus&body=Hey%20${contact.contactName},%0A%0AI'd%20like%20to%20chat%20with%20you%20on%20Syncronus.%20Join%20me%20on%20the%20platform!`;
                    } else if (hasPhone) {
                      alert(
                        `This contact has only a phone number.\nYou can invite them manually:\nPhone: ${hasPhone}`
                      );
                    } else {
                      alert("This contact doesn't have enough info to invite.");
                    }
                  };

                  return (
                    <div
                      className="flex gap-3 cursor-pointer items-center"
                      key={contact._id}
                      onClick={handleClick}
                    >
                      <div className="w-12 h-12 relative">
                        <Avatar className="h-10 w-10 rounded-full overflow-hidden border-1 border-white">
                          {isRegistered && linked?.image ? (
                            <AvatarImage
                              src={`${HOST}/${linked.image}`}
                              alt="profile-photo"
                              className="object-cover h-full w-full bg-black"
                            />
                          ) : (
                            <div
                              className={`uppercase h-full w-full text-lg flex items-center justify-center ${getColor(
                                linked?.color || 1
                              )} rounded-full`}
                            >
                              {contact.contactName?.charAt(0) ||
                                contact.contactEmail?.charAt(0) ||
                                contact.contactPhoneNo?.charAt(0)}
                            </div>
                          )}
                        </Avatar>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {contact.contactName || "Unnamed Contact"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isRegistered
                            ? linked?.email || linked?.phoneNo
                            : contact.contactEmail || contact.contactPhoneNo}
                        </span>
                        {!isRegistered && (
                          <span className="text-xs text-yellow-400 italic">
                            Invite to join
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
