import { useCall } from "@/context/CallContext";
import { useContacts } from "@/context/ContactContext";
import { apiClient } from "@/lib/api-client";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const IncomingCallUI = () => {
  const { incomingCall, inCall, answerCall, endCall } = useCall();
  const { chatList } = useContacts();
  const [allUsers, setAllUsers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const containerRef = useRef(null);

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

  const matchingContact = allContacts.find(
    (c) => c.linkedUser?._id === callerId || c.linkedUser.id === callerId
  );

  const matchingUser = allUsers.find(
    (u) => u._id === callerId || u.id === callerId
  );
  console.log(matchingUser);
  const callerName =
    matchingContact?.contactName || `+91 ${matchingUser?.phoneNo}`;

  if (!incomingCall || !callerId || isAnswered) return null;

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
        {/* Buttons for desktop */}
        {!isMobile && (
          <div className="flex flex-col items-center text-center px-4 py-5">
            {/* Caller Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-400 shadow-lg mb-4">
              <img
                src={matchingUser.image || "/profile-picture.png"}
                alt="Caller Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-zinc-900 mb-1">
              Incoming {incomingCall?.type === "video" ? "Video" : "Audio"} Call
            </h2>

            {/* Caller Name */}
            <p className="text-sm text-zinc-500 mb-5">{callerName}</p>

            {/* Call Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                onClick={() => answerCall(incomingCall)}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-md transition duration-200"
                aria-label="Accept Call"
              >
                <Phone size={24} />
              </button>
              <button
                onClick={endCall}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition duration-200"
                aria-label="Reject Call"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        )}

        {isMobile && incomingCall && !isAnswered && (
          <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12 bg-white text-zinc-900">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl mb-6">
              <img
                src={matchingUser.image || "/profile-picture.png"}
                alt="Caller Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-2xl font-bold mb-1">
              {callerName || "Unknown Caller"}
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
