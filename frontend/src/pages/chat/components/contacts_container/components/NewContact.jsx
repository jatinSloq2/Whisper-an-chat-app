import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client"; // adjust path if needed
import { useContacts } from "@/context/ContactContext";
import { toast } from "sonner"; // optional toast for feedback
import { ADD_CONTACTS } from "@/utils/constant";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FaPlus } from "react-icons/fa";

const NewContact = () => {
  const [open, setOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneNo, setContactPhoneNo] = useState("");
  const { fetchContacts } = useContacts();
  const [loading, setLoading] = useState(false);

  const handleAddContact = async () => {
  console.log("Form submitted"); // First log
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

    console.log("Success Response:", res);
    toast.success(res.data?.message || "Contact added successfully!");

    setOpen(false);
    setContactName("");
    setContactEmail("");
    setContactPhoneNo("");
    fetchContacts();
  } catch (error) {
    console.error("Error caught:", error);
    toast.error(error.response?.data?.message || "Failed to add contact.");
  } finally {
    setLoading(false);
  }
};

  return (
<>
    <Tooltip>
        <TooltipTrigger>
          <FaPlus
            className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 duration-300 transition-all"
            onClick={() => {
              setOpen(true);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Add new contact</p>
        </TooltipContent>
      </Tooltip>



    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#1b1c24] text-white">
        <h2 className="text-lg mb-4">Add New Contact</h2>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            />
          <Input
            placeholder="Email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={contactPhoneNo}
            onChange={(e) => setContactPhoneNo(e.target.value)}
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
