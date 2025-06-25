import { useCall } from "@/context/CallContext";
import { useAppStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";

const IncomingCallUI = () => {
  const { incomingCall, inCall, answerCall, endCall } = useCall();
  const { contacts = [] } = useAppStore();

  const callerId = incomingCall?.from;
  const isAnswered = inCall; // <- important check

  // Don't show incoming UI if already answered
  if (!incomingCall || !callerId || isAnswered) return null;

  const callerName =
    contacts.find((c) => c.id === callerId)?.contactName || `+${callerId}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center"
      >
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-3xl text-gray-600 dark:text-white shadow-md">
              📞
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Incoming {incomingCall.type === "video" ? "Video" : "Audio"} Call
          </h2>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-300">
            {callerName}
          </p>

          <div className="mt-6 flex justify-center gap-6">
            <button
              onClick={() => answerCall(incomingCall)}
              className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center text-white text-xl transition"
              aria-label="Accept Call"
            >
              ✅
            </button>
            <button
              onClick={endCall}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 shadow-lg flex items-center justify-center text-white text-xl transition"
              aria-label="Reject Call"
            >
              ❌
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallUI;
