import ContactsList from "@/components/ContactsList";
import { useContacts } from "@/context/ContactContext";
import Logo from "./components/Logo";

const Contacts_container = () => {
  const { contacts, groups } = useContacts();
  const unifiedContacts = [...contacts, ...groups].map((c) => ({
    ...c,
    isGroup: Array.isArray(c.members),
  }));
  return (
    <div
      className={`relative w-full md:w-[35vw] xl:w-[25vw] bg-gray-100 border-r-1 border-gray-300`}
    >
      {/* Logo */}
      <div className="pt-3">
        <Logo unifiedContacts={unifiedContacts} />
      </div>

      <div className="my-5">
        <div className="max-h-[76vh] overflow-y-auto scrollbar-hidden">
          <ContactsList contacts={unifiedContacts} />
        </div>
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
