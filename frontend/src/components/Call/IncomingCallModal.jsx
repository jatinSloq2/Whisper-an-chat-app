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
        setAllContacts(data.contacts || []);
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
  const matchingContact = allContacts.find(
    (c) => c.linkedUser?._id === callerId
  );
  const matchingUser = allUsers.find((u) => u._id === callerId);
  const callerName =
    matchingContact?.contactName || `+91 ${matchingUser?.phoneNo}`;

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

        {isMobile && incomingCall && !isAnswered && (
          <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12 bg-white text-zinc-900">
            {/* Caller Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl mb-6">
              <img
                src={matchingUser.image || "/profile-picture.png"}
                alt="Caller Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caller Name */}
            <p className="text-2xl font-bold mb-1">
              {callerName|| "Unknown Caller"}
            </p>

            {/* Call Type */}
            <p className="text-sm text-zinc-500 mb-8">
              Incoming {incomingCall.type === "video" ? "Video" : "Audio"}{" "}
              Call...
            </p>

            {/* Quick Reply Message */}
            <div className="w-full bg-zinc-100 border border-zinc-300 rounded-lg p-4 mb-10 shadow-sm text-center">
              <p className="text-sm text-zinc-700 font-medium leading-tight">
                “Hey, can’t talk right now. What’s up?”
              </p>
            </div>

            {/* Call Buttons */}
            <div className="flex justify-center items-center gap-12">
              <button
                onClick={() => answerCall(incomingCall)}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition duration-200"
                aria-label="Answer Call"
              >
                <Phone size={28} />
              </button>
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition duration-200"
                aria-label="Reject Call"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallUI;
