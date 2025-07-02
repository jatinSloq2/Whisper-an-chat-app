import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContacts } from "@/context/ContactContext";
import { apiClient } from "@/lib/api-client";
import { CREATE_NEW_GROUP, GET_ALL_CONTACTS, HOST } from "@/utils/constant";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const NewChannel = ({ trigger }) => {
  const { fetchChatList } = useContacts();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContactForAdding = async () => {
      try {
        const res = await apiClient.get(GET_ALL_CONTACTS);
        if (res.status === 200) {
          const registeredContacts = res.data.contacts.filter(
            (contact) => contact.isRegistered
          );
          setAllContacts(registeredContacts);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts.");
      }
    };
    fetchContactForAdding();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
      toast.error("Group name and at least one member are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(CREATE_NEW_GROUP, {
        name: groupName.trim(),
        members: selectedContacts.map((c) => c.value),
      });

      if (res.status === 201) {
        toast.success("Group created successfully!");
        setGroupName("");
        setSelectedContacts([]);
        setOpen(false);
      }
      // fetchGroups()
      fetchChatList();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            {trigger}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Create new group</p>
        </TooltipContent>
      </Tooltip>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-none shadow-2xl rounded-xl w-[500px] max-w-full h-[420px] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg text-purple-500 font-semibold">
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500">
              Give your group a name and select members to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="rounded-md p-3 border border-gray-300 shadow-sm"
            />
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {selectedContacts.map((contact) => (
                  <div
                    key={contact.value}
                    className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full text-sm"
                  >
                    {contact.image ? (
                      <img
                        src={`${contact.image}`}
                        alt={contact.label}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-200 text-xs flex items-center justify-center text-white">
                        {contact.label?.[0]}
                      </div>
                    )}
                    <span>{contact.label}</span>
                    <button
                      onClick={() =>
                        setSelectedContacts((prev) =>
                          prev.filter((c) => c.value !== contact.value)
                        )
                      }
                      className="text-gray-500 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-2">
              {allContacts.map((contact) => {
                const isSelected = selectedContacts.some(
                  (c) => c.value === contact.value
                );

                return (
                  <div
                    key={contact.value}
                    onClick={() => {
                      setSelectedContacts((prev) =>
                        isSelected
                          ? prev.filter((c) => c.value !== contact.value)
                          : [...prev, contact]
                      );
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border ${
                      isSelected
                        ? "bg-purple-100 border-purple-400"
                        : "bg-white hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    {contact.image ? (
                      <img
                        src={`${contact.image}`}
                        alt={contact.label}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-purple-600 uppercase">
                        {contact.label?.[0] || "U"}
                      </div>
                    )}
                    <span className="font-medium text-gray-800">
                      {contact.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleCreateGroup}
              disabled={loading}
              className="bg-[#8338ec] hover:bg-[#702ed9] transition text-white mt-2"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewChannel;
