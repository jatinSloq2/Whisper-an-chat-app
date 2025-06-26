import MediaControlButton from "@/components/Call/MediaControlButton";
import { useCall } from "@/context/CallContext";
import { SwitchCamera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    callType,
    endCall,
    localStream,
    remoteStreamState,
    callAccepted,
    replaceVideoTrack,
  } = useCall();

  const isVideoCall = callType === "video";
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [callStartTime, setCallStartTime] = useState(null);
  const [duration, setDuration] = useState("00:00");

  // 🕓 Call duration timer
  useEffect(() => {
    if (!inCall) {
      setCallStartTime(null);
      setDuration("00:00");
      setMuted(false);
      setCameraOff(false);
      return;
    }
    if (inCall && callAccepted && !callStartTime) {
      setCallStartTime(Date.now());
    }
  }, [inCall, callAccepted]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!callStartTime) return;
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const sec = String(elapsed % 60).padStart(2, "0");
      setDuration(`${min}:${sec}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartTime]);

  // ✅ Ensure self video always appears once call is accepted
  useEffect(() => {
    if (isVideoCall && callAccepted && localRef.current && localStream?.current) {
      localRef.current.srcObject = localStream.current;
    }
  }, [callAccepted, isVideoCall]);

  // ✅ Attach remote video/audio when ready
  useEffect(() => {
    if (!remoteStreamState) return;
    if (remoteRef.current) remoteRef.current.srcObject = remoteStreamState;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamState;
  }, [remoteStreamState]);

  const toggleMute = () => {
    const track = localStream?.current?.getAudioTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = localStream?.current?.getVideoTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOff(!track.enabled);
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
      const newTrack = newStream.getVideoTracks()[0];
      localStream.current.removeTrack(oldTrack);
      localStream.current.addTrack(newTrack);
      localRef.current.srcObject = localStream.current;
      await replaceVideoTrack(newTrack);
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    } catch (err) {
      console.error("Camera switch failed", err);
    }
  };

  if (!inCall) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="text-center mb-4">
        <p className="text-gray-300 text-sm">
          {isVideoCall ? "Video Call" : "Audio Call"}
        </p>
        <p className="text-sm mt-2 text-gray-400">
          {callAccepted ? duration : "Calling..."}
        </p>
      </div>

      {isVideoCall ? (
        <div className="relative w-full max-w-xl h-[60vh] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-4 right-4 w-24 h-20 border border-white rounded-md object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-4xl">
            🎧
          </div>
          <p className="mt-4 text-white text-lg">
            {callAccepted ? duration : "Calling..."}
          </p>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay hidden />

      <div className="mt-6 flex gap-4 flex-wrap justify-center">
        <MediaControlButton
          onClick={toggleMute}
          icon={muted ? <MdMicOff className="text-red-500" /> : <MdMic />}
          label={muted ? "Unmute" : "Mute"}
        />

        <MediaControlButton
          onClick={endCall}
          icon={<MdOutlineCallEnd />}
          label="End"
          className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 text-2xl"
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
              label={cameraOff ? "Camera On" : "Camera Off"}
            />
            <MediaControlButton
              onClick={switchCamera}
              icon={<SwitchCamera />}
              label="Switch"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OngoingCallUI;
