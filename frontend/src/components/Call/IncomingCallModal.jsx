import { useCall } from "@/context/CallContext";
import { useContacts } from "@/context/ContactContext";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const IncomingCallUI = () => {
  const { incomingCall, inCall, answerCall, endCall } = useCall();
  const { chatList  } = useContacts();

  const [isMobile, setIsMobile] = useState(false);
  const callerId = incomingCall?.from;
  const isAnswered = inCall;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!incomingCall || !callerId || isAnswered) return null;

  const callerName =
    chatList.find((c) => c.id === callerId)?.contactName || `+${callerId}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`fixed z-[9999] ${
          isMobile
            ? "inset-0 bg-black text-white flex flex-col items-center justify-center"
            : "bottom-4 right-4 w-72 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl cursor-grab active:cursor-grabbing"
        }`}
        drag={!isMobile}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-3 shadow-inner">
            📞
          </div>
          <h2 className="text-lg font-bold dark:text-white">
            Incoming {incomingCall.type === "video" ? "Video" : "Audio"} Call
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
        {isMobile && (
          <motion.div
            className="flex justify-between w-full px-10 mt-10"
            drag="y"
            dragConstraints={{ top: -100, bottom: 100 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -80) answerCall(incomingCall); // Swipe up
              if (info.offset.y > 80) endCall(); // Swipe down
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center text-xl">
                ↑
              </div>
              <span className="mt-1 text-sm">Answer</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center text-xl">
                ↓
              </div>
              <span className="mt-1 text-sm">Reject</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallUI;
