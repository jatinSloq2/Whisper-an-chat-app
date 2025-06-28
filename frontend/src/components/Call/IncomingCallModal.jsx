import { useCall } from "@/context/CallContext";
import { useContacts } from "@/context/ContactContext";
import { apiClient } from "@/lib/api-client";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";

const IncomingCallUI = () => {
  const { incomingCall, inCall, answerCall, endCall } = useCall();
  const { chatList } = useContacts();
  const [allUsers, setAllUsers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  const [isMobile, setIsMobile] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const callerId = incomingCall?.from;
  const isAnswered = inCall;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isMobile) endCall();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, endCall]);

   useEffect(() => {
    const fetchAllContacts = async () => {
      try {
        const { data } = await apiClient.get("/api/auth/allcontacts");
        setAllContacts(data.allContacts || []);
      } catch (err) {
        console.error("❌ Failed to fetch contacts:", err);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const { data } = await apiClient.get("/api/auth/allusers");
        setAllUsers(data.allUsers || []);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
      }
    };

    fetchAllContacts();
    fetchAllUsers();
  }, []);

  if (!incomingCall || !callerId || isAnswered) return null;

  const matchingContact = allContacts.find((c) => c.id === callerId);
  const matchingUser = allUsers.find((u) => u._id === callerId);
  const callerName = matchingContact?.contactName || `+91 ${matchingUser?.phoneNo}`;

  console.log("📞 Incoming call from:", callerName);
  if (matchingContact) {
    console.log("📇 Contact Info:", {
      id: matchingContact.id,
      name: matchingContact.contactName,
      firstName: matchingContact.firstName,
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        style={{ x, y }}
        drag={!isMobile}
        dragMomentum={false}
        dragElastic={0.2}
        className={`fixed z-[9999] ${
          isMobile
            ? "inset-0 bg-black text-white flex flex-col items-center justify-center"
            : "bottom-4 right-4 w-72 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl cursor-grab active:cursor-grabbing"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-3 shadow-inner">
            📞
          </div>
          <h2 className="text-lg font-bold dark:text-white">
            Incoming {incomingCall?.type === "video" ? "Video" : "Audio"} Call
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {callerName}
          </p>
        </div>

        {/* Buttons for desktop */}
        {!isMobile && (
          <div className="flex justify-center gap-6 mt-2">
            <button
              onClick={() => answerCall(incomingCall)}
              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center text-xl"
              aria-label="Accept Call"
            >
              ✅
            </button>
            <button
              onClick={endCall}
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xl"
              aria-label="Reject Call"
            >
              ❌
            </button>
          </div>
        )}

        {/* Swipe UI for mobile */}
        {isMobile && incomingCall && !isAnswered && (
          <div className="flex flex-col items-center justify-center w-full h-full px-6 py-10 bg-black text-white">
            {/* Caller Image */}
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
              <img
                src={incomingCall.avatar || "/default-avatar.png"}
                alt="Caller Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caller Info */}
            <p className="text-xl font-semibold">
              {incomingCall.name || "Unknown Caller"}
            </p>
            <p className="text-gray-400 text-sm mb-8">Incoming Call...</p>

            {/* Static Message Box */}
            <div className="w-full bg-white text-black rounded-xl p-3 mb-6">
              <p className="text-sm font-medium">
                "Hey, can’t talk right now. What's up?"
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-10">
              <button
                onClick={() => answerCall(incomingCall)}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg"
                aria-label="Answer Call"
              >
                <Phone />
              </button>
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                aria-label="Reject Call"
              >
                <PhoneOff />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallUI;
