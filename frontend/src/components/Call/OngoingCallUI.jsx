import MediaControlButton from "@/components/Call/MediaControlButton";
import { useCall } from "@/context/CallContext";
import { SwitchCamera, User2, Phone } from "lucide-react";
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
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);

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

  // Auto-hide controls for video calls
  useEffect(() => {
    if (!isVideoCall) return;
    
    const resetTimeout = () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
      setShowControls(true);
      const timeout = setTimeout(() => setShowControls(false), 3000);
      setControlsTimeout(timeout);
    };

    resetTimeout();
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [isVideoCall]);

  const handleMouseMove = () => {
    if (!isVideoCall) return;
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  };

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
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center text-white"
      onMouseMove={handleMouseMove}
    >
      {/* Header with call info */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6 transition-all duration-300 ${
          isVideoCall && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isVideoCall ? (
              <MdVideocam className="text-green-400" size={20} />
            ) : (
              <Phone className="text-green-400" size={20} />
            )}
            <p className="text-white font-medium">
              {isVideoCall ? "Video Call" : "Audio Call"}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${callAccepted ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
            <p className="text-lg font-mono text-gray-200">
              {callAccepted ? duration : "Connecting..."}
            </p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        {isVideoCall ? (
          <div className="relative w-full max-w-4xl h-full max-h-[70vh] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Remote video */}
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Placeholder when no remote stream */}
            {!remoteStreamState && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-xl">
                  <User2 size={64} className="text-white" />
                </div>
                <p className="text-white text-lg font-medium">Waiting for connection...</p>
                <div className="flex gap-2 mt-4">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-32 h-40 md:w-40 md:h-48 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800">
              {cameraOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                  <MdVideocamOff size={40} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-400">Camera Off</p>
                </div>
              ) : (
                <video
                  ref={localRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        ) : (
          // Audio call UI
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-2xl">
                <Phone size={64} className="text-white" />
              </div>
              {callAccepted && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center border-4 border-black shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-2xl md:text-3xl font-mono text-white">
                {callAccepted ? duration : "Calling..."}
              </p>
              <p className="text-gray-400 text-sm">
                {callAccepted ? "Connected" : "Waiting for response..."}
              </p>
            </div>

            {!callAccepted && (
              <div className="flex gap-2 mt-6">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        )}
      </div>

      <audio ref={remoteAudioRef} autoPlay hidden />

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 md:p-8 transition-all duration-300 ${
          isVideoCall && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex gap-4 flex-wrap justify-center items-center">
          <MediaControlButton
            onClick={toggleMute}
            icon={muted ? <MdMicOff size={24} /> : <MdMic size={24} />}
            label={muted ? "Unmute" : "Mute"}
            className={`w-14 h-14 md:w-16 md:h-16 ${
              muted 
                ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500' 
                : 'bg-white/10 hover:bg-white/20 border-white/20'
            }`}
          />

          <MediaControlButton
            onClick={endCall}
            icon={<MdOutlineCallEnd size={28} />}
            label="End Call"
            className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 md:w-20 md:h-20 border-none shadow-lg shadow-red-500/50"
          />

          {isVideoCall && (
            <>
              <MediaControlButton
                onClick={toggleCamera}
                icon={cameraOff ? <MdVideocamOff size={24} /> : <MdVideocam size={24} />}
                label={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                className={`w-14 h-14 md:w-16 md:h-16 ${
                  cameraOff 
                    ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20'
                }`}
              />
              <MediaControlButton
                onClick={switchCamera}
                icon={<SwitchCamera size={24} />}
                label="Switch Camera"
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 border-white/20"
              />
            </>
          )}
        </div>

        {/* Quick tip */}
        {isVideoCall && showControls && (
          <p className="text-center text-gray-400 text-xs mt-4 animate-fade-in">
            Move your mouse to show controls
          </p>
        )}
      </div>
    </div>
  );
};

export default OngoingCallUI;