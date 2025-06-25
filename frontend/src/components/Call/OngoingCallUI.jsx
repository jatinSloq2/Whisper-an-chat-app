import { useCall } from "@/context/CallContext";
import { AnimatePresence, motion } from "framer-motion";
import { SwitchCamera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  MdOutlineCallEnd,
  MdMicOff,
  MdMic,
  MdVideocam,
  MdVideocamOff,
} from "react-icons/md";

const OngoingCallUI = () => {
  const {
    inCall,
    endCall,
    localStream,
    remoteStreamState,
    callType,
    callAccepted,
    replaceVideoTrack,
  } = useCall();

  const localRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [callStartTime, setCallStartTime] = useState(null);
  const [duration, setDuration] = useState("00:00");
  const [playBlocked, setPlayBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  const remotePlayedRef = useRef(false);
  const localPlayedRef = useRef(false);

  useEffect(() => {
    if (!inCall) {
      setCallStartTime(null);
      setDuration("00:00");
      remotePlayedRef.current = false;
      localPlayedRef.current = false;
      setPlayBlocked(false);
      setMuted(false);
      setCameraOff(false);
    }
  }, [inCall]);

  useEffect(() => {
    if (inCall && callAccepted && !callStartTime) {
      setCallStartTime(Date.now());
    }
  }, [inCall, callAccepted, callStartTime]);

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

  useEffect(() => {
    if (!remoteStreamState || remotePlayedRef.current) return;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamState;
      remoteVideoRef.current.play().catch((err) => {
        console.warn("🔇 Remote video autoplay blocked:", err.message);
        setPlayBlocked(true);
      });
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamState;
      remoteAudioRef.current.play().catch((err) => {
        console.warn("🔇 Remote audio autoplay blocked:", err.message);
        setPlayBlocked(true);
      });
    }
    console.log("🎧 Attaching remote stream to audio", remoteStreamState);
    console.log("📹 Remote videoRef:", remoteVideoRef.current);
    console.log("🔊 Remote audioRef:", remoteAudioRef.current);
    remotePlayedRef.current = true;
  }, [remoteStreamState]);
  console.log(remoteStreamState?.getAudioTracks());
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

  const isVideoCall = callType === "video";

  const toggleMute = () => {
    const audioTrack = localStream?.current
      ?.getAudioTracks()
      ?.find((t) => t.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStream?.current
      ?.getVideoTracks()
      ?.find((t) => t.kind === "video");
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };

  const switchCamera = async () => {
    try {
      const videoTrack = localStream?.current?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop(); // Stop current video track

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode === "user" ? "environment" : "user" },
          audio: false, // only video needed
        });

        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace in UI stream
        localStream.current.removeTrack(videoTrack);
        localStream.current.addTrack(newVideoTrack);
        localRef.current.srcObject = localStream.current;

        // Replace in peer connection
        await replaceVideoTrack(newVideoTrack);

        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
      }
    } catch (err) {
      console.error("Camera switch failed:", err);
    }
  };

  if (!inCall) return null;

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

        {/* Media UI */}
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

        <audio ref={remoteAudioRef} autoPlay hidden />

        {/* Manual resume for autoplay-block */}
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

        {/* Controls */}
        <div className="mt-6 flex items-center gap-6">
          {/* Mic toggle */}
          <button
            onClick={toggleMute}
            className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xl transition"
          >
            {muted ? <MdMicOff className="text-red-500" /> : <MdMic />}
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg flex items-center justify-center text-2xl transition"
            aria-label="End Call"
          >
            <MdOutlineCallEnd />
          </button>

          {/* Camera toggle */}
          {isVideoCall && (
            <button
              onClick={toggleCamera}
              className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xl transition"
            >
              {cameraOff ? (
                <MdVideocamOff className="text-red-500" />
              ) : (
                <MdVideocam />
              )}
            </button>
          )}
          {isVideoCall && (
            <button
              onClick={switchCamera}
              className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xl transition"
              title="Switch Camera"
            >
              <SwitchCamera />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OngoingCallUI;
