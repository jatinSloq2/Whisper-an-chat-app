// ✅ Updated OngoingCallUI.jsx with Mobile Support + Draggable Mini View Fix

import MediaControlButton from "@/components/Call/MediaControlButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCall } from "@/context/CallContext";
import { AnimatePresence, motion } from "framer-motion";
import { SwitchCamera, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import {
  MdMic,
  MdMicOff,
  MdOutlineCallEnd,
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
    viewMode,
    setViewMode,
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

  const isVideoCall = callType === "video";

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
    if (!callStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      setDuration(`${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartTime]);

  useEffect(() => {
    if (localRef.current && localStream?.current && !localPlayedRef.current) {
      localRef.current.srcObject = localStream.current;
      localRef.current
        .play()
        .then(() => (localPlayedRef.current = true))
        .catch((e) => console.warn("🔇 Local video autoplay blocked:", e.message));
    }
  }, [localStream]);

  useEffect(() => {
    if (!remoteStreamState || remotePlayedRef.current) return;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamState;
      remoteVideoRef.current.play().catch(() => setPlayBlocked(true));
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamState;
      remoteAudioRef.current.play().catch(() => setPlayBlocked(true));
    }

    remotePlayedRef.current = true;
  }, [remoteStreamState]);

  const toggleMute = () => {
    const audioTrack = localStream?.current?.getAudioTracks()?.[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStream?.current?.getVideoTracks()?.[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };

  const switchCamera = async () => {
    try {
      const oldTrack = localStream?.current?.getVideoTracks()?.[0];
      if (!oldTrack) return;

      oldTrack.stop();

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode === "user" ? "environment" : "user" },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      localStream.current.removeTrack(oldTrack);
      localStream.current.addTrack(newVideoTrack);
      localRef.current.srcObject = localStream.current;

      await replaceVideoTrack(newVideoTrack);
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    } catch (err) {
      console.error("Camera switch failed:", err);
    }
  };

  const resumeMedia = () => {
    remoteVideoRef.current?.play().catch(console.warn);
    remoteAudioRef.current?.play().catch(console.warn);
    setPlayBlocked(false);
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
        className="z-[9999] text-white"
      >
        {viewMode === "mini" ? (
          <div className="fixed bottom-4 right-4 cursor-move w-[90vw] max-w-[270px] sm:w-64 sm:h-36 h-[140px] z-[9999]">
            <Draggable bounds="parent" cancel="video">
              <Card className="w-full h-full overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl relative">
                <CardContent className="p-0 h-full">
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
                    className="absolute bottom-2 right-2 w-20 h-16 rounded-md border border-white object-cover bg-zinc-800"
                  />
                </CardContent>
              </Card>
            </Draggable>
          </div>
        ) : (
          <div
            className={
              viewMode === "full"
                ? "fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-[9998]"
                : "flex flex-col items-center justify-center p-6"
            }
          >
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-300">
                {isVideoCall ? "Video Call" : "Audio Call"}
              </p>
              {!callAccepted ? (
                <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 font-semibold animate-pulse">
                  🔔 Ringing...
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-2">{duration}</p>
              )}
            </div>

            {isVideoCall ? (
              <Card className="w-full max-w-xl h-[60vh] overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl relative">
                <CardContent className="p-0 h-full">
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
                </CardContent>
              </Card>
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

            {playBlocked && (
              <div className="mt-4 w-full max-w-sm">
                <Alert
                  variant="default"
                  className="bg-emerald-700/10 border-emerald-600"
                >
                  <Volume2 className="h-4 w-4" />
                  <AlertTitle>Media Paused</AlertTitle>
                  <AlertDescription>
                    <Button onClick={resumeMedia} className="mt-2">
                      🔊 Tap to resume media
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <TooltipProvider>
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                <MediaControlButton
                  onClick={toggleMute}
                  icon={muted ? <MdMicOff className="text-red-500" /> : <MdMic />}
                  label={muted ? "Unmute" : "Mute"}
                />

                <MediaControlButton
                  onClick={endCall}
                  icon={<MdOutlineCallEnd />}
                  label="End Call"
                  className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 text-2xl"
                  variant="default"
                />

                {isVideoCall && (
                  <>
                    <MediaControlButton
                      onClick={toggleCamera}
                      icon={
                        cameraOff ? (
                          <MdVideocamOff className="text-red-500" />
                        ) : (
                          <MdVideocam />
                        )
                      }
                      label={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                    />

                    <MediaControlButton
                      onClick={switchCamera}
                      icon={<SwitchCamera />}
                      label="Switch Camera"
                    />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "full" ? "default" : "full")}
                >
                  {viewMode === "full" ? "Exit Fullscreen" : "Fullscreen"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "mini" ? "default" : "mini")}
                >
                  {viewMode === "mini" ? "Expand" : "Mini View"}
                </Button>
              </div>
            </TooltipProvider>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OngoingCallUI;
