import { useCall } from "@/context/CallContext";
import { apiClient } from "@/lib/api-client";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Phone, PhoneCall, PhoneOff, User2, Video } from "lucide-react";
import { useEffect, useState } from "react";

const IncomingCallUI = () => {
  const { incomingCall, inCall, answerCall, endCall } = useCall();
  const [allUsers, setAllUsers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    (c) => c.linkedUser?._id === callerId || c.linkedUser?.id === callerId
  );

  const matchingUser = allUsers.find(
    (u) => u._id === callerId || u.id === callerId
  );

  const callerName = matchingContact?.contactName || matchingUser?.phoneNo
    ? `+91 ${matchingUser?.phoneNo}`
    : "Unknown Caller";

  const callerImage = matchingUser?.image;
  const isDefaultImage = callerImage === "uploads/profiles/profile-picture.png";

  const handleAnswer = async () => {
    setIsLoading(true);
    try {
      await answerCall(incomingCall);
    } catch (error) {
      console.error("Error answering call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    endCall();
  };

  if (!incomingCall || !callerId || isAnswered) return null;

  const isVideoCall = incomingCall?.type === "video";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        style={!isMobile ? { x, y } : {}}
        drag={!isMobile}
        dragMomentum={false}
        dragElastic={0.2}
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        className={`fixed z-[9999] ${isMobile
            ? "inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600"
            : "bottom-6 right-6 w-80"
          }`}
      >
        {/* Desktop View */}
        {!isMobile && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                {isVideoCall ? (
                  <Video size={18} className="animate-pulse" />
                ) : (
                  <PhoneCall size={18} className="animate-pulse" />
                )}
                <p className="text-sm font-medium">
                  Incoming {isVideoCall ? "Video" : "Audio"} Call
                </p>
              </div>
              <p className="text-xs opacity-90">Tap to answer or reject</p>
            </div>

            {/* Caller Info */}
            <div className="flex flex-col items-center text-center px-6 py-6 bg-white dark:bg-zinc-900">
              {/* Avatar with pulse animation */}
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-ping opacity-75" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
                  {callerImage && !isDefaultImage ? (
                    <img
                      src={callerImage}
                      alt="Caller Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <User2 size={40} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Caller Name */}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                {callerName}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {matchingUser?.email || "Calling..."}
              </p>

              {/* Action Buttons */}
              <div className="flex justify-center gap-6 w-full">
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="group relative w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Reject Call"
                >
                  <PhoneOff size={24} />
                  <div className="absolute inset-0 rounded-full bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                </button>

                <button
                  onClick={handleAnswer}
                  disabled={isLoading}
                  className="group relative w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Accept Call"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Phone size={24} />
                  )}
                  <div className="absolute inset-0 rounded-full bg-green-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">ESC</kbd> to reject
              </p>
            </div>
          </div>
        )}

        {/* Mobile View */}
        {isMobile && (
          <div className="flex flex-col items-center justify-between w-full h-full px-6 py-12 text-white">
            {/* Top Section */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Call type indicator */}
              <div className="flex items-center gap-2 mb-8">
                {isVideoCall ? (
                  <Video size={24} className="animate-pulse" />
                ) : (
                  <PhoneCall size={24} className="animate-pulse" />
                )}
                <p className="text-sm font-medium uppercase tracking-wider">
                  {isVideoCall ? "Video" : "Audio"} Call
                </p>
              </div>

              {/* Avatar with multiple pulse rings */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  {callerImage && !isDefaultImage ? (
                    <img
                      src={callerImage}
                      alt="Caller Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <User2 size={64} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Caller Info */}
              <h2 className="text-3xl font-bold mb-2 text-center">
                {callerName}
              </h2>
              <p className="text-sm opacity-90 mb-4">
                {matchingUser?.email || "Calling..."}
              </p>

              {/* Ringing indicator */}
              <div className="flex items-center gap-2 mt-6">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            {/* Bottom Section - Action Buttons */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Swipe hint */}
              <p className="text-sm opacity-75 mb-2">
                Answer or decline the call
              </p>

              <div className="flex justify-center items-center gap-16">
                {/* Reject Button */}
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="group relative flex flex-col items-center gap-2"
                  aria-label="Reject Call"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <PhoneOff size={32} className="text-white" />
                    <div className="absolute inset-0 rounded-full bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium">Decline</span>
                </button>

                {/* Answer Button */}
                <button
                  onClick={handleAnswer}
                  disabled={isLoading}
                  className="group relative flex flex-col items-center gap-2"
                  aria-label="Answer Call"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {isLoading ? (
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Phone size={32} className="text-white" />
                    )}
                    <div className="absolute inset-0 rounded-full bg-green-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium">
                    {isLoading ? "Connecting..." : "Answer"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallUI;