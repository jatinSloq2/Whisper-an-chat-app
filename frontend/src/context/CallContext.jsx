import { useSocket } from "@/context/socketContext";
import { useAppStore } from "@/store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useUI } from "./UIcontext";

const CallContext = createContext();

const STUN_TURN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:global.relay.metered.ca:80",
      "turn:global.relay.metered.ca:443",
      "turn:global.relay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const CALL_TIMEOUT = 30000;
const DEBUG_MODE = true;
const debug = (...args) =>
  DEBUG_MODE && console.log("%c[Call Debug]", "color: cyan", ...args);

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();
  const { setIsLoading } = useUI();

  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [remoteStreamState, setRemoteStreamState] = useState(null);
  const [viewMode, setViewMode] = useState("default");

  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);
  const callActive = useRef(false);
  const incomingCallTimeoutRef = useRef(null);
  const iceQueue = useRef([]);
  const callLogSent = useRef(false);
  const callEndedByMe = useRef(false);

  const toggleViewMode = () =>
    setViewMode((prev) => (prev === "mini" ? "full" : "mini"));

  const logCall = ({
    sender,
    recipient,
    type,
    status,
    startedAt,
    endedAt,
    duration = 0,
  }) => {
    if (callLogSent.current) return debug("🚫 Duplicate log prevented");
    callLogSent.current = true;

    const now = new Date();
    socket.emit("store-call-log", {
      sender,
      recipient,
      messageType: type,
      callDetails: {
        duration,
        startedAt: startedAt || now,
        endedAt: endedAt || now,
        status,
      },
    });
  };

  const getSafeUserMedia = async ({ video }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video,
      });
      if (!stream.getAudioTracks().length)
        toast.error("No audio input detected.");
      return stream;
    } catch (err) {
      toast.error("Permission denied or no media device.");
      return null;
    }
  };

  const applyQueuedCandidates = async () => {
    for (const candidate of iceQueue.current) {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.warn("❌ Failed to apply queued ICE:", err);
      }
    }
    iceQueue.current = [];
  };

  const initPeerConnection = (toUserId) => {
    peerConnection.current?.close?.();
    peerConnection.current = new RTCPeerConnection({
      iceServers: STUN_TURN_SERVERS,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      sdpSemantics: "unified-plan",
    });

    peerConnection.current.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { to: toUserId, candidate });
    };

    peerConnection.current.ontrack = ({ streams }) => {
      remoteStream.current = streams[0];
      setRemoteStreamState(streams[0]);
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current.connectionState;
      if (["disconnected", "failed", "closed"].includes(state)) endCall();
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current.iceConnectionState;
      if (["disconnected", "failed"].includes(state)) endCall();
    };
  };

  const continueStartCall = async (toUserId, type, stream) => {
    try {
      initPeerConnection(toUserId);
      setCallType(type);
      setPeerId(toUserId);
      localStream.current = stream;
      localStream.current.activeStartTime = new Date();
      callActive.current = true;
      setInCall(true);

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        from: userInfo.id,
        to: toUserId,
        type,
        offer,
      });
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      toast.error("Could not start the call.");
      endCall();
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = useCallback(
    async (toUserId, type = "audio") => {
      callEndedByMe.current = false;
      callLogSent.current = false;
      setIsLoading(true);

      socket.emit("check-user-availability", { to: toUserId }, async (res) => {
        if (!res?.online)
          return toast.error("User is not available."), setIsLoading(false);
        const stream = await getSafeUserMedia({ video: type === "video" });
        if (!stream) return setIsLoading(false);
        await continueStartCall(toUserId, type, stream);
      });
    },
    [socket, userInfo, setIsLoading]
  );

  const answerCall = useCallback(
    async ({ from, offer, type }) => {
      callEndedByMe.current = false;
      callLogSent.current = false;
      setIsLoading(true);

      const stream = await getSafeUserMedia({ video: type === "video" });
      if (!stream || !offer?.sdp) return setIsLoading(false);

      try {
        initPeerConnection(from);
        setCallType(type);
        setPeerId(from);
        localStream.current = stream;
        localStream.current.activeStartTime = new Date();
        callActive.current = true;
        setInCall(true);

        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await applyQueuedCandidates();
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("answer-call", { to: from, answer });
        setCallAccepted(true);
        clearTimeout(incomingCallTimeoutRef.current);
      } catch (err) {
        stream.getTracks().forEach((t) => t.stop());
        toast.error("Call failed to connect.");
        endCall();
      } finally {
        setIsLoading(false);
      }
    },
    [socket, userInfo, setIsLoading]
  );

  const endCall = useCallback(() => {
    if (!callActive.current && !incomingCall) return;

    if (!callEndedByMe.current) {
      socket.emit("end-call", {
        to: peerId || incomingCall?.from,
        from: userInfo.id,
      });
    }

    const end = new Date();
    const start = localStream.current?.activeStartTime || end;
    const duration = callAccepted ? Math.floor((end - start) / 1000) : 0;
    const status = callAccepted
      ? "answered"
      : incomingCall
      ? "missed"
      : "rejected";

    if (!callLogSent.current) {
      logCall({
        sender: userInfo.id,
        recipient: peerId || incomingCall?.from,
        type: callType,
        status,
        startedAt: start,
        endedAt: end,
        duration,
      });
    }

    callLogSent.current = true;
    callActive.current = false;
    callEndedByMe.current = false;

    peerConnection.current?.close?.();
    peerConnection.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;

    setInCall(false);
    setIncomingCall(null);
    setPeerId(null);
    setCallAccepted(false);
    setCallType(null);
    setRemoteStreamState(null);
    clearTimeout(incomingCallTimeoutRef.current);
  }, [socket, userInfo, peerId, incomingCall, callAccepted, callType]);

  const replaceVideoTrack = async (newTrack) => {
    try {
      const sender = peerConnection.current
        ?.getSenders()
        ?.find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);
    } catch (err) {
      console.error("❌ Failed to replace video track:", err);
    }
  };

  useEffect(() => {
    const handleUnload = () => {
      if (callActive.current) {
        callEndedByMe.current = true;
        endCall();
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [endCall]);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer, type }) => {
      if (inCall) return socket.emit("user-busy", { to: from });
      setIncomingCall({ from, offer, type });
      incomingCallTimeoutRef.current = setTimeout(() => {
        callEndedByMe.current = true;
        endCall();
        setIncomingCall(null);
        toast.info("Call timed out.");
      }, CALL_TIMEOUT);
    });

    socket.on("call-answered", async ({ answer }) => {
      try {
        if (answer?.sdp && peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          await applyQueuedCandidates();
          setCallAccepted(true);
        }
      } catch (err) {
        console.error("❌ Remote answer failed:", err);
      }
    });

    socket.on("user-busy", ({ to }) => {
      if (to === userInfo.id) {
        endCall();
        toast.error("User is currently on another call.");
        setIsLoading(false);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (peerConnection.current?.signalingState === "stable") {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          iceQueue.current.push(candidate);
        }
      } catch (err) {
        console.warn("⚠️ ICE candidate error:", err);
      }
    });

    socket.on("call-ended", () => {
      callEndedByMe.current = true;
      endCall();
      toast.info("The other user has ended the call.");
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("user-busy");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket, inCall, endCall]);

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
        callType,
        callAccepted,
        remoteStreamState,
        replaceVideoTrack,
        viewMode,
        setViewMode,
        toggleViewMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
