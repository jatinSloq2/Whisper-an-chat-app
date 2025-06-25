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
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

 const getSafeUserMedia = async (constraints) => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMic = devices.some((d) => d.kind === "audioinput");

    if (!hasMic) {
      toast.error("No microphone found.");
      return null;
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (!stream || !stream.active) {
      toast.error("Microphone permission denied or inactive.");
      return null;
    }

    console.log("🎙️ Media stream acquired:", stream);
    return stream;
  } catch (err) {
    console.error("❌ getUserMedia error:", err);
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      toast.error("Permission denied. Please allow microphone access.");
    } else {
      toast.error("Error accessing media: " + err.message);
    }
    return null;
  }
};

  const initPeerConnection = (toUserId) => {
    console.log("📡 Initializing PeerConnection...");
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
      if (!remoteStream.current) {
        remoteStream.current = new MediaStream();
        setRemoteAudio(remoteStream.current);
      }
      remoteStream.current.addTrack(event.track);
    };

    peerConnection.current.oniceconnectionstatechange = () =>
      console.log("ICE State:", peerConnection.current.iceConnectionState);

    peerConnection.current.onconnectionstatechange = () =>
      console.log("Connection State:", peerConnection.current.connectionState);
  };

  const startCall = async (toUserId, type = "audio") => {
    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });

    if (!stream) {
      toast.error("Audio permission is required to start the call.");
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

      initPeerConnection(toUserId);
      stream.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, stream)
      );

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
      toast.error("Failed to start the call.");
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
      toast.error("Audio permission is required to answer the call.");
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

      initPeerConnection(from);
      stream.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, stream)
      );

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
      toast.error("Failed to answer the call.");
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
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
  if (candidate && peerConnection.current) {
    console.log("✅ Received ICE candidate:", candidate);
    try {
      peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
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
