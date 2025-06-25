import React, { useEffect, useRef, useState } from "react";
import { useCall } from "@/context/CallContext";
import { motion, AnimatePresence } from "framer-motion";

const OngoingCallUI = () => {
  const { inCall, endCall, localStream, remoteStream, callType, callAccepted  } = useCall();

  const localRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [callStartTime, setCallStartTime] = useState(null);
  const [duration, setDuration] = useState("00:00");

  // ⛔️ Prevent leftover state from previous calls
  useEffect(() => {
    if (!inCall) {
      setCallStartTime(null);
      setDuration("00:00");
    }
  }, [inCall]);

  // Start timer when call really starts
  useEffect(() => {
    if (inCall && !callStartTime) {
  setCallStartTime(Date.now());
}

    if (localRef.current && localStream?.current) {
      localRef.current.srcObject = localStream.current;
    }

    if (remoteStream?.current) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream.current;
      }
    }
  }, [inCall, localStream, remoteStream]);

  // Update call duration
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      setDuration(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  if (!inCall || !callAccepted) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ongoing-call"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="fixed inset-0 z-[9999] bg-black/90 text-white flex flex-col items-center justify-center p-6"
      >
        <p className="text-sm text-gray-300 mb-2">
          {callType === "video" ? "Video Call" : "Audio Call"}
        </p>

        {callType === "video" ? (
          <div className="relative w-full max-w-xl h-[60vh] rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
            />
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-28 h-20 rounded-md shadow-lg border border-white object-cover bg-zinc-900"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-4xl shadow-xl">
              🎧
            </div>
            <p className="text-lg mt-4 font-semibold text-white">{duration}</p>
          </div>
        )}

        <audio ref={remoteAudioRef} autoPlay hidden />
        {callType === "video" && (
          <p className="mt-4 text-sm text-gray-400">{duration}</p>
        )}

        <button
          onClick={endCall}
          className="mt-6 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg flex items-center justify-center text-2xl transition"
          aria-label="End Call"
        >
          📴
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default OngoingCallUI;
