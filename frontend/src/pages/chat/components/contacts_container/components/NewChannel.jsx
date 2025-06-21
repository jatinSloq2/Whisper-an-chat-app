import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { CREATE_NEW_GROUP, GET_ALL_CONTACTS } from "@/utils/constant";
import { Button } from "@/components/ui/button";
import MultipleSelector from "@/components/ui/multipleselect";
import { useContacts } from "@/context/ContactContext";

const NewChannel = () => {
  const { addGroup } = useContacts();

  const [newChannelModel, setNewChannelModel] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const allContacts = async () => {
      const res = await apiClient.get(GET_ALL_CONTACTS);
      setAllContacts(res.data.contacts);
      console.log(res);
    };
    allContacts();
  }, []);

  const createChannel = async () => {
    try {
      if (groupName.length > 0 && selectedContacts.length > 0) {
        const res = await apiClient.post(CREATE_NEW_GROUP, {
          name: groupName,
          members: selectedContacts.map((contacts) => contacts.value),
        });
        if (res.status === 201) {
          setGroupName("");
          setSelectedContacts([]);
          setNewChannelModel(false);
          addGroup(res.data.group);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <FaPlus
            className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 duration-300 transition-all"
            onClick={() => {
              setNewChannelModel(true);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new Group</p>
        </TooltipContent>
      </Tooltip>
      {/* {This */}

      <Dialog open={newChannelModel} onOpenChange={setNewChannelModel}>
        <DialogContent className="bg-[#181920] border-none text-white w-[500px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Please fill up the details for new channel
            </DialogTitle>
          </DialogHeader>
          <div>
            <Input
              placeholder="Channel Name "
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={(e) => setGroupName(e.target.value)}
              value={groupName}
            />
          </div>
          <div>
            <MultipleSelector
              className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white"
              defaultOptions={allContacts}
              placeholder="Search Contacts"
              value={selectedContacts}
              onChange={setSelectedContacts}
              emptyIndicator={
                <p className="text-center text-lg leading-10 text-gray-600">
                  No results
                </p>
              }
            />
          </div>
          <div>
            <Button
              className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
              onClick={createChannel}
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewChannel;
