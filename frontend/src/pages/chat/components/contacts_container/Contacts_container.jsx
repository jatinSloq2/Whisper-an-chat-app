import ChatListSkeleton from "@/components/ChatListSkeleton";
import ContactsList from "@/components/ContactsList";
import { useContacts } from "@/context/ContactContext";
import { useUI } from "@/context/UIcontext";
import { useMemo } from "react";
import Logo from "./components/Logo";

const Contacts_container = () => {
  const { chatList } = useContacts();
  const { isContactsLoading } = useUI();

  const unifiedContacts = useMemo(() => {
    return [...chatList].map((c) => ({
      ...c,
      isGroup: Array.isArray(c.members),
    }));
  }, [chatList]);

   console.log(isContactsLoading, "isLoading");

  return (
    <div className="w-full md:w-[35%] xl:w-[25%] bg-gray-100 border-r border-gray-300 flex flex-col h-full">
      <div className="pt-3 px-4">
        <Logo unifiedContacts={unifiedContacts} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300">
        {isContactsLoading ? (
          <ChatListSkeleton />
        ) : (
          <ContactsList contacts={unifiedContacts} />
        )}
      </div>
    </div>
  );
};

export default Contacts_container;

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-black font-light pl-10 text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
