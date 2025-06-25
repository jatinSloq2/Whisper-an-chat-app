import { useCall } from "@/context/CallContext";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineCallEnd } from "react-icons/md";

const OngoingCallUI = () => {
  const {
    inCall,
    endCall,
    localStream,
    remoteStreamState,
    callType,
    callAccepted,
  } = useCall();

  const localRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [callStartTime, setCallStartTime] = useState(null);
  const [duration, setDuration] = useState("00:00");

  const remotePlayedRef = useRef(false); // prevent re-calling play()
  const localPlayedRef = useRef(false);
  const [playBlocked, setPlayBlocked] = useState(false); // fallback if autoplay fails

  // Reset on call end
  useEffect(() => {
    if (!inCall) {
      setCallStartTime(null);
      setDuration("00:00");
      remotePlayedRef.current = false;
      localPlayedRef.current = false;
      setPlayBlocked(false);
    }
  }, [inCall]);

  // Start timer
  useEffect(() => {
    if (inCall && callAccepted && !callStartTime) {
      setCallStartTime(Date.now());
    }
  }, [inCall, callAccepted, callStartTime]);

  // Bind local stream
  useEffect(() => {
    if (localRef.current && localStream?.current && !localPlayedRef.current) {
      localRef.current.srcObject = localStream.current;
      localRef.current
        .play()
        .then(() => {
          localPlayedRef.current = true;
        })
        .catch((e) =>
          console.warn("🔇 Local video autoplay blocked:", e.message)
        );
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (
      remoteStreamState &&
      remoteVideoRef.current &&
      !remotePlayedRef.current
    ) {
      remoteVideoRef.current.srcObject = remoteStreamState;
      remoteAudioRef.current.srcObject = remoteStreamState;

      Promise.all([
        remoteVideoRef.current.play(),
        remoteAudioRef.current.play(),
      ])
        .then(() => {
          remotePlayedRef.current = true;
        })
        .catch((err) => {
          console.warn("🔇 Remote media autoplay blocked:", err.message);
          setPlayBlocked(true);
        });
    }
  }, [remoteStreamState]);

  // Duration updater
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

  if (!inCall) return null;

  const isVideoCall = callType === "video";

  return (
    <AnimatePresence>
      <motion.div
        key="ongoing-call-ui"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="fixed inset-0 z-[9999] bg-black/90 text-white flex flex-col items-center justify-center p-6"
      >
        {/* Call Info */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-300">
            {isVideoCall ? "Video Call" : "Audio Call"}
          </p>
          {!callAccepted ? (
            <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 font-semibold animate-pulse">
              <span>🔔 Ringing...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">{duration}</p>
          )}
        </div>

        {/* Media */}
        {isVideoCall ? (
          <div className="relative w-full max-w-xl h-[60vh] rounded-xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
            />
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-4 right-4 w-28 h-20 rounded-md shadow-lg border border-white object-cover bg-zinc-800"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-5xl shadow-xl">
              🎧
            </div>
            <p className="text-lg mt-4 font-semibold text-white">
              {callAccepted ? duration : "Calling..."}
            </p>
          </div>
        )}

        {/* Remote audio (hidden) */}
        <audio ref={remoteAudioRef} autoPlay hidden />

        {/* Manual play fallback */}
        {playBlocked && (
          <button
            className="mt-4 px-4 py-2 bg-emerald-600 rounded-md hover:bg-emerald-700 text-white"
            onClick={() => {
              remoteVideoRef.current?.play().catch(console.warn);
              remoteAudioRef.current?.play().catch(console.warn);
              setPlayBlocked(false);
            }}
          >
            🔊 Tap to resume media
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="mt-6 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg flex items-center justify-center text-2xl transition"
          aria-label="End Call"
        >
          <MdOutlineCallEnd />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default OngoingCallUI;
