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

const NewContact = ({ trigger }) => {
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
          <p>Add new contact</p>
        </TooltipContent>
      </Tooltip>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-none shadow-2xl rounded-xl w-[400px] max-w-full h-[350px] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg text-purple-400 font-semibold">
              Add New Contact
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-400">
              Start a conversation by saving the contact first.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            <Input
              placeholder="Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="rounded-md p-3 border border-gray-300 shadow-sm"
            />
            <Input
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-md p-3 border border-gray-300 shadow-sm"
            />
            <Input
              placeholder="Phone Number"
              value={contactPhoneNo}
              onChange={(e) => setContactPhoneNo(e.target.value)}
              className="rounded-md p-3 border border-gray-300 shadow-sm"
            />
            <Button
              onClick={handleAddContact}
              disabled={loading}
              className="bg-[#8338ec] hover:bg-[#702ed9] transition text-white mt-2"
            >
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewContact;
