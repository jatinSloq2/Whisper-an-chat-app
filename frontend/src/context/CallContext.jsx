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
import { apiClient } from "@/lib/api-client";

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
  const [remoteStreamState, setRemoteStreamState] = useState(null);

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const callActive = useRef(false);
  const iceQueue = useRef([]);

  const debug = (...args) =>
    console.log("%c[Call Debug]", "color: cyan", ...args);

  const getIceServers = async () => {
    try {
      const { data } = await apiClient.get(
        "https://whisper-backend-kcj2.onrender.com/api/call/ice"
      );
      debug("Fetched ICE servers", data);
      return data.iceServers;
    } catch (err) {
      console.error("❌ ICE server fetch failed:", err);
      return [{ urls: "stun:stun.l.google.com:19302" }];
    }
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

      debug("Media stream acquired:", stream);
      return stream;
    } catch (err) {
      console.error("🎙️ getUserMedia error:", err);
      toast.error(
        err.name === "NotAllowedError"
          ? "Permission denied. Please allow microphone access."
          : "Error accessing media: " + err.message
      );
      return null;
    }
  };

  const awaitIceGatheringComplete = (pc) =>
    new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const listener = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", listener);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", listener);
    });

  const initPeerConnection = (toUserId, iceServers) => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    debug("Initializing peer connection...");
    const pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: "relay" });
    peerConnection.current = pc;

    remoteStream.current = new MediaStream();
    setRemoteAudio(remoteStream.current);
    setRemoteStreamState(remoteStream.current);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("ice-candidate", {
          to: toUserId,
          candidate,
        });
        debug("Sent ICE candidate:", candidate);
      }
    };

    pc.ontrack = (e) => {
      debug("Received remote track");
      e.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
      setRemoteStreamState(new MediaStream([...remoteStream.current.getTracks()]));
    };

    pc.oniceconnectionstatechange = () => {
      debug("ICE Connection:", pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      debug("Peer Connection:", pc.connectionState);
    };
  };

  const startCall = async (toUserId, type = "audio") => {
    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream) return toast.error("Audio permission is required to call.");

    try {
      const iceServers = await getIceServers();
      initPeerConnection(toUserId, iceServers);

      setCallType(type);
      localStream.current = stream;
      setLocalAudio(stream);
      setPeerId(toUserId);
      callActive.current = true;
      setInCall(true);

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      await awaitIceGatheringComplete(peerConnection.current);

      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer: peerConnection.current.localDescription,
      });

      debug("Call offer sent");
    } catch (err) {
      console.error("❌ startCall failed:", err);
      toast.error("Could not start the call.");
      endCall();
    }
  };

  const answerCall = async ({ from, offer, type }) => {
    if (!offer?.sdp || !offer?.type) return toast.error("Invalid call offer.");

    const stream = await getSafeUserMedia({
      video: type === "video",
      audio: true,
    });
    if (!stream) return;

    try {
      const iceServers = await getIceServers();
      initPeerConnection(from, iceServers);

      setCallType(type);
      localStream.current = stream;
      setLocalAudio(stream);
      setPeerId(from);
      callActive.current = true;
      setInCall(true);

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      await awaitIceGatheringComplete(peerConnection.current);

      socket.emit("answer-call", {
        to: from,
        answer: peerConnection.current.localDescription,
      });

      setCallAccepted(true);
      debug("Answered call");
    } catch (err) {
      console.error("❌ answerCall failed:", err);
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
      console.warn("⚠️ Error closing connection:", err);
    }

    peerConnection.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());

    localStream.current = null;
    remoteStream.current = null;

    setLocalAudio(null);
    setRemoteAudio(null);
    setInCall(false);
    setIncomingCall(null);
    setPeerId(null);
    setCallAccepted(false);

    if (socket && userInfo?.id) {
      socket.emit("end-call", {
        to: peerId || incomingCall?.from,
        from: userInfo.id,
      });
    }

    debug("Call ended");
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (offer?.type && offer?.sdp) {
        setIncomingCall({ from, offer, type });
        debug("Incoming call from", from);
      }
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          setCallAccepted(true);
          debug("Call answered");
        }
      } catch (err) {
        console.error("❌ Error applying remote answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (peerConnection.current?.remoteDescription) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          debug("Added ICE candidate");
        } else {
          iceQueue.current.push(candidate);
          debug("Queued ICE candidate");
        }
      } catch (err) {
        console.warn("⚠️ Failed to add ICE candidate:", err);
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
         remoteStreamState, 
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
