import React, { useState } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useContacts } from "@/context/ContactContext";
import { toast } from "sonner";
import { ADD_CONTACTS } from "@/utils/constant";
import { FiUserPlus } from "react-icons/fi";
import { User, User2Icon, UserPlus } from "lucide-react";

const NewContact = ({trigger}) => {
  const [open, setOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneNo, setContactPhoneNo] = useState("");
  const { fetchContacts } = useContacts();
  const [loading, setLoading] = useState(false);

  const handleAddContact = async () => {
    if (!contactName || (!contactEmail && !contactPhoneNo)) {
      toast.error("Name and at least email or phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(ADD_CONTACTS, {
        contactName,
        contactEmail,
        contactPhoneNo,
      });

      toast.success(res.data?.message || "Contact added successfully!");
      setOpen(false);
      setContactName("");
      setContactEmail("");
      setContactPhoneNo("");
      fetchContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger with Tooltip */}
            <Tooltip delayDuration={400}>
      
        <TooltipTrigger asChild>
          <div
            onClick={(e) =>{ e.stopPropagation(); setOpen(true)}}
            className=""
          >
            {trigger}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Add new contact</p>
        </TooltipContent>
      </Tooltip>

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1b1c24] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Start a chat with a registered contact or add them now 
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="bg-[#2c2e3b] border-none"
            />
            <Input
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="bg-[#2c2e3b] border-none"
            />
            <Input
              placeholder="Phone Number"
              value={contactPhoneNo}
              onChange={(e) => setContactPhoneNo(e.target.value)}
              className="bg-[#2c2e3b] border-none"
            />
            <Button onClick={handleAddContact} disabled={loading}>
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewContact;
