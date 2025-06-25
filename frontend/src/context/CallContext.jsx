import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import { toast } from "sonner";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();

  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState(null);

  const [localAudio, setLocalAudio] = useState(null);
  const [remoteAudio, setRemoteAudio] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const callActive = useRef(false);

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const getSafeUserMedia = async (constraints) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === "videoinput");
      const hasMic = devices.some((d) => d.kind === "audioinput");
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        console.log("Available devices:");
        devices.forEach((device) => {
          console.log(`${device.kind}: ${device.label}`);
        });
      });
      if (constraints.video && !hasCamera) {
        toast.error("No camera device found.");
        return null;
      }
      if (constraints.audio && !hasMic) {
        toast.error("No microphone device found.");
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (err) {
      console.error("🚫 getUserMedia error:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Permissions denied for camera/microphone.");
      } else if (err.name === "NotFoundError") {
        toast.error("Required media device not found.");
      } else if (err.name === "NotReadableError") {
        toast.error("Camera or microphone is already in use.");
      } else {
        toast.error("Failed to access media devices.");
      }
      return null;
    }
  };

  const initPeerConnection = (toUserId, type) => {
    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: toUserId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      const remoteStreamObject = event.streams[0];
      remoteStream.current = remoteStreamObject;
      setRemoteAudio(remoteStreamObject);

      const remoteAudioEl = document.getElementById("remote-audio");
      if (remoteAudioEl) remoteAudioEl.srcObject = remoteStreamObject;

      const remoteVideoEl = document.getElementById("remote-video");
      if (remoteVideoEl) remoteVideoEl.srcObject = remoteStreamObject;
    };
  };

  const startCall = async (toUserId, type = "video") => {
    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream) {
      toast.error("Video input failed. Switching to audio-only call.");
      return; // or set fallback to audio-only
    }

    if (!stream) {
      endCall();
      return;
    }

    try {
      setCallType(type);
      localStream.current = stream;
      setLocalAudio(stream);
      setPeerId(toUserId);
      callActive.current = true;
      setInCall(true);

      const localVideoEl = document.getElementById("local-video");
      if (localVideoEl) localVideoEl.srcObject = stream;

      initPeerConnection(toUserId, type);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer,
      });
    } catch (err) {
      console.error("❌ startCall error:", err);
      toast.error("Failed to start call.");
      endCall();
    }
  };

  const answerCall = async ({ from, offer, type }) => {
    if (!offer?.type || !offer?.sdp) {
      toast.error("Invalid call offer received.");
      return;
    }

    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream) {
      toast.error("Video input failed. Switching to audio-only call.");
      return; // or set fallback to audio-only
    }

    if (!stream) {
      endCall();
      return;
    }

    try {
      setCallType(type);
      localStream.current = stream;
      setLocalAudio(stream);
      setPeerId(from);
      callActive.current = true;
      setInCall(true);

      const localVideoEl = document.getElementById("local-video");
      if (localVideoEl) localVideoEl.srcObject = stream;

      initPeerConnection(from, type);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: from,
        answer: peerConnection.current.localDescription,
      });

      setCallAccepted(true);
    } catch (err) {
      console.error("❌ answerCall error:", err);
      toast.error("Failed to answer call.");
      endCall();
    }
  };

  const endCall = () => {
    if (!callActive.current && !incomingCall) return;

    callActive.current = false;

    try {
      peerConnection.current?.close();
    } catch (err) {
      console.warn("⚠️ Error closing peerConnection:", err);
    }

    peerConnection.current = null;

    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
    setLocalAudio(null);

    remoteStream.current = null;
    setRemoteAudio(null);

    setInCall(false);
    setIncomingCall(null);

    if (socket && userInfo?.id) {
      socket.emit("end-call", {
        to: peerId || incomingCall?.from,
        from: userInfo.id,
      });
    }

    setPeerId(null);
    setCallAccepted(false);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (offer?.type && offer?.sdp) {
        setIncomingCall({ from, offer, type });
      }
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (answer?.type && answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
        setCallAccepted(true);
      } catch (err) {
        console.error("❌ Error applying remote answer:", err);
        toast.error("Error finalizing call connection.");
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate && peerConnection.current) {
        try {
          peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.warn("⚠️ Failed to add ICE candidate:", err);
        }
      }
    });

    socket.on("call-ended", () => {
      endCall();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket]);

  return (
    <CallContext.Provider
      value={{
        inCall,
        incomingCall,
        startCall,
        answerCall,
        endCall,
        localStream,
        remoteStream,
        localAudio,
        remoteAudio,
        callType,
        callAccepted,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
